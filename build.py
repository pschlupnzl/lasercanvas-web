import base64
import re
import json
from jsmin import jsmin # Install with: pip3 install jsmin

'''
Hacked-together script to combine the JavaScript, stylesheet, and image files
into a single JavaScript bundle file.

The launching HTML page should have an element
```html
<div id="root"></div>
```
into which the LaserCanvas engine is rendered.
'''

MINIFY_OUTPUT = True

def getSelector(tag, lines, skip = 0):
    while skip < len(lines):
        if '<' + tag in lines[skip]:
            last = skip
            while last < len(lines):
                if '</' + tag + '>' in lines[last]:
                    return lines[skip + 1:last]
                last += 1
        skip += 1
    return None

outname = 'dist/lasercanvas-web.js'
minf = ''
style_rules = []
def w(line = None):
    global minf, style_rules
    if line is None:
        minf = '\n'.join([
            '!function(){',
            # Style rules.
            '\n'.join([
                '!function (styles) { ',
                '  var t = document.createElement("style");',
                '  document.getElementsByTagName("head")[0].appendChild(t);',
                '  t.type = "text/css";',
                '  for(var k = 0; k < styles.length; k += 1) {',
                '    t.sheet.insertRule(styles[k]);',
                '  }',
                '}(' + json.dumps(style_rules) + ');\n'
            ]) if len(style_rules) > 0 else '',
            # Content script.
            minf,
            '}();'])
        with open(outname, 'wt') as out:
            out.write(jsmin(minf, quote_chars='\'"`') if MINIFY_OUTPUT else minf)
    else:
        minf += line

loadername = 'js/LaserCanvasLoader.js'
def theme_filter(src):
    '''Replace image URLs with inline base64.'''
    src = re.sub(r'(baseUrl\s*=\s*).*', r'\1"";', src)
    for r in re.findall(r"""(['"])(.*\.)(png)['"]""", src):
        ext = r[2]
        filename = r[1] + ext
        path = 'res/' + filename
        encoded = base64.b64encode(open(path, 'rb').read()).decode()
        
        src = src.replace(
            filename,
            'data:image/' + ext + ';base64,' + encoded
            )
    return src

filter = {
    loadername: lambda src: re.sub(r'(\+\s*files\.length)', r'/* \1 */', src)\
        .replace('loadFiles()', '/* loadFiles() */')\
        .replace('version_info.php', ''),
    'js/LaserCanvasTheme.js': theme_filter
}

def loader_processor(src):
    '''Post-processing for the JavaScript loader file.'''
    files = re.search(r'files\s*=\s*\[([\s\S]*?)\]', src)[1]
    for filename in re.findall(r'"(.+?)"', files):
        if '.js' in filename:
            add_script(filename)
        if '.css' in filename:
            add_style(filename)
    add_styles('.helpButton.docs { display: none; }')

processor = {
    loadername: loader_processor
}

def add_script(filename):
    '''Adds a referenced JavaScript file.'''
    with open(filename, 'rt') as f:
        src = f.read()
        if filename in filter:
            src = filter[filename](src)
        w('\n\n\n/* ======= ' + filename + ' ======= */\n')
        w(src)
        if filename in processor:
            processor[filename](src)

def add_styles(src):
    '''Add the style rules in the string.'''
    global style_rules
    src = re.sub(r'\/\*[\s\S]*?\*\/', '', src)
    c = 0
    level = 0
    while c < len(src):
        if src[c] == '}':
            level -= 1
            if level == 0:
                rule = re.sub(r'(?:^\s*|[\r\n]\s*)', '', src[0 : c + 1])
                style_rules.append(rule)
                src = src[c + 1:]
                c = 0
        elif src[c] == '{':
            level += 1
        c += 1

def add_style(filename):
    '''Adds a referenced CSS file.'''
    with open(filename, 'rt') as f:
        add_styles(f.read())

def add_html(filename):
    '''Add the root HTML file.'''
    with open(filename, 'rt') as f:
        src = f.read()

        # Meta tags.
        for meta in re.findall(r'<meta ([\s\S]*?)\/?>', src):
            w('\n'.join([
                '!function(){',
                '   var t = document.createElement("meta");',
                '   document.getElementsByTagName("head")[0].appendChild(t);',
                '\n'.join([
                    '   t.setAttribute("' + attr[0] + '", "' + attr[1] + '");'
                    for attr in
                    re.findall(r"""(?:^|\s*)(.*?)=["'](.*?)['"]""", meta)
                ]),
                '}();'
            ]))

        # Inline stylesheet.
        for style in re.findall(r'<style[\s\S]*?>([\s\S]*?)<\/style>', src):
            add_styles(style)

        # Linked stylesheets.
        for link in re.findall(r"""<link([\s\S]*?)(?:\/>|><\/link>)""", src):
            if re.search(r"""rel=["']?stylesheet['"]?""", link):
                href = re.search(r"""href=["'](.*?)['"]""", link)[1]
                if href.startswith('http'):
                    w('\n'.join([
                        '!function(){',
                        '   var t = document.createElement("link");',
                        '   document.getElementsByTagName("head")[0].appendChild(t);',
                        '   t.rel = "stylesheet";',
                        '   t.href = "' + href + '";'
                        '}();'
                    ]))
                else:
                    add_style(href)

        # Body attributes and HTML.
        match = re.search(r'<body\s*([\s\S]*?)>([\s\S]*?)<\/body>', src)
        if match:
            attr = match[1]
            w('\n'.join(['document.body.setAttribute("' + m[1] + '", "' + m[2] + '");'
                for m in
                [re.search(r"""(.*?)=['"](.*?)['"]""", a) for a in attr.split()]
            ]))

            body = match[2]
            w('\n'.join([
                'document.getElementById("root").innerHTML = ',
                # Replace single quotes.
                "'" + re.sub(r"'", "\\'",
                # Remove gaps between tags.
                re.sub(r'(>)[\s\n\r]+(<)', r'\1 \2',
                # Remove newline + indent spaces.
                re.sub(r'(?:[\n\r]+\s+|[\n\r\s]+$)', '',
                # Remove <!-- HTML comments -->.
                re.sub(r'(?:\s+>|<!\-\-[\s\S]*?\-\->)', '',
                body)))) + "'",
                ';',
            ]))    

add_html('index.html')
add_script(loadername)

w()
