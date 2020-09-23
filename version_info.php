<?php
        exec('git log --pretty="%cd (%h)" --date=short -n1 HEAD', $version_info);
        print('Version: ' . $version_info[0]);
?>