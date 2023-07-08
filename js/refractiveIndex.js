(function (LaserCanvas) {
   function set() {
      if (!LaserCanvas.Sellmeier) {
         setTimeout(set, 10);
         return;
      }
   
      LaserCanvas.Sellmeier.refractiveIndex = [
{
   "book": "Al2O3",
   "coefficients": [0, 1.503976, 0.0740288, 0.5506914, 0.1216529, 6.592738, 20.07225],
   "comments": "Synthetic sapphire, Extraordinary ray (e), 20 °C",
   "formula": 1,
   "range": [0.2, 5],
   "references": "1) I. H. Malitson and M. J. Dodge. Refractive Index and Birefringence of Synthetic Sapphire, <a href=\"http://www.opticsinfobase.org/josa/abstract.cfm?uri=josa-62-11-1336\"><i>J. Opt. Soc. Am.</i> <b>62</b>, 1405 (1972)</a><br>2) M. J. Dodge, \"Refractive Index\" in Handbook of Laser Science and Technology, Volume IV, Optical Materials: Part 2, CRC Press, Boca Raton, 1986, p. 30<br>* Ref. 1 is a talk abstract in a conference program; Ref. 2 provides Sellmeier equation",
   "source": "Malitson-e"
},
{
   "book": "Al2O3",
   "coefficients": [0, 1.431349, 0.0726631, 0.6505471, 0.1193242, 5.341402, 18.02825],
   "comments": "Synthetic sapphire, Ordinary ray (o), 20 °C",
   "formula": 1,
   "range": [0.2, 5],
   "references": "1) I. H. Malitson and M. J. Dodge. Refractive Index and Birefringence of Synthetic Sapphire, <a href=\"http://www.opticsinfobase.org/josa/abstract.cfm?uri=josa-62-11-1336\"><i>J. Opt. Soc. Am.</i> <b>62</b>, 1405 (1972)</a><br>2) M. J. Dodge, \"Refractive Index\" in Handbook of Laser Science and Technology, Volume IV, Optical Materials: Part 2, CRC Press, Boca Raton, 1986, p. 30<br>* Ref. 1 is a talk abstract in a conference program; Ref. 2 provides Sellmeier equation",
   "source": "Malitson-o"
},
{
   "book": "Al2O3",
   "coefficients": [0, 1.023798, 0.06144821, 1.058264, 0.1106997, 5.280792, 17.92656],
   "comments": "Synthetic sapphire, Ordinary ray (o), 24 °C",
   "formula": 1,
   "range": [0.2652, 5.577],
   "references": "I. H. Malitson. Refraction and dispersion of synthetic sapphire, <a href=\"https://doi.org/10.1364/JOSA.52.001377\"><i>J. Opt. Soc. Am.</i> <b>52</b>, 1377-1379 (1962)</a>",
   "source": "Malitson"
},
{
   "book": "BaB2O4",
   "coefficients": [2.373, 0.0128, 0, 0.0156, 1, 0, 0, 0, 1],
   "comments": "Beta barium borate (β-BaB<sub>2</sub>O<sub>4</sub>, BBO). Extraordinary ray (e).",
   "formula": 4,
   "range": [0.22, 1.06],
   "references": "D. Eimerl, L. Davis, S. Velsko, E. K. Graham and A. Zalkin. Optical, mechanical, and thermal properties of barium borate , <a href=\"https://doi.org/10.1063/1.339536\"><i>J. Appl. Phys.</i>, <b>62</b>, 1968-1983 (1987)</a>",
   "source": "Eimerl-e"
},
{
   "book": "BaB2O4",
   "coefficients": [2.7405, 0.0184, 0, 0.0179, 1, 0, 0, 0, 1],
   "comments": "Beta barium borate (β-BaB<sub>2</sub>O<sub>4</sub>, BBO). Ordinary ray (o).",
   "formula": 4,
   "range": [0.22, 1.06],
   "references": "D. Eimerl, L. Davis, S. Velsko, E. K. Graham and A. Zalkin. Optical, mechanical, and thermal properties of barium borate , <a href=\"https://doi.org/10.1063/1.339536\"><i>J. Appl. Phys.</i>, <b>62</b>, 1968-1983 (1987)</a>",
   "source": "Eimerl-o"
},
{
   "book": "BaB2O4",
   "coefficients": [2.3753, 0.01224, 0, 0.01667, 1, 0, 0, 0, 1],
   "comments": "Beta barium borate (β-BaB<sub>2</sub>O<sub>4</sub>, BBO). Extraordinary ray (e). Near infrared.",
   "formula": 4,
   "range": [0.64, 3.18],
   "references": "D. Zhang, Y. Kong, J.-Y. Zhang. Optical parametric properties of 532-nm-pumped beta-barium-borate near the infrared absorption edge, <a href=\"https://doi.org/10.1016/S0030-4018(00)00968-8\"><i>Optics Communications</i>, <b>184</b>, 485-491 (2000)</a>",
   "source": "Zhang-e"
},
{
   "book": "BaB2O4",
   "coefficients": [2.7359, 0.01878, 0, 0.01822, 1, 0, 0, 0, 1],
   "comments": "Beta barium borate (β-BaB<sub>2</sub>O<sub>4</sub>, BBO). Ordinary ray (o). Near infrared.",
   "formula": 4,
   "range": [0.64, 3.18],
   "references": "D. Zhang, Y. Kong, J.-Y. Zhang. Optical parametric properties of 532-nm-pumped beta-barium-borate near the infrared absorption edge, <a href=\"https://doi.org/10.1016/S0030-4018(00)00968-8\"><i>Optics Communications</i>, <b>184</b>, 485-491 (2000)</a>",
   "source": "Zhang-o"
},
{
   "book": "BaF2",
   "coefficients": [0.33973, 0.8107, 0.10065, 0.19652, 29.87, 4.52469, 53.82],
   "comments": "293 K (20 °C).",
   "formula": 1,
   "range": [0.15, 15],
   "references": "H. H. Li. Refractive index of alkaline earth halides and its wavelength and temperature derivatives. <a href=\"https://doi.org/10.1063/1.555616\"><i>J. Phys. Chem. Ref. Data</i> <b>9</b>, 161-289 (1980)</a> and references therein.<br> <sup>*</sup> Sellmeier formula is derived by critical analysis of experimental data from several sources.",
   "source": "Li"
},
{
   "book": "BaF2",
   "coefficients": [0, 0.643356, 0.057789, 0.506762, 0.10968, 3.8261, 46.3864],
   "comments": "25 °C",
   "formula": 1,
   "range": [0.2652, 10.346],
   "references": "I. H. Malitson. Refractive properties of barium fluoride, <a href=\"https://doi.org/10.1364/JOSA.54.000628\"><i>J. Opt. Soc. Am.</i> <b>54</b>, 628-630 (1964)</a>",
   "source": "Malitson"
},
{
   "book": "BaTiO3",
   "coefficients": [0, 4.064, 0.211],
   "comments": "Extraordinary ray (e). Room temperature",
   "formula": 1,
   "range": [0.4, 0.7],
   "references": "S.H. Wemple, M. Didomenico Jr., and I. Camlibel. Dielectric and optical properties of melt-grown BaTiO<sub>3</sub>, <a href=\"https://doi.org/10.1016/0022-3697(68)90164-9\"><i>J. Phys. Chem. Solids</i> <b>29</b>, 1797-1803 (1968)</a>",
   "source": "Wemple-e"
},
{
   "book": "BaTiO3",
   "coefficients": [0, 4.187, 0.223],
   "comments": "Ordinary ray (o). Room temperature.",
   "formula": 1,
   "range": [0.4, 0.7],
   "references": "S.H. Wemple, M. Didomenico Jr., and I. Camlibel. Dielectric and optical properties of melt-grown BaTiO<sub>3</sub>, <a href=\"https://doi.org/10.1016/0022-3697(68)90164-9\"><i>J. Phys. Chem. Solids</i> <b>29</b>, 1797-1803 (1968)</a>",
   "source": "Wemple-o"
},
{
   "book": "BiB3O6",
   "coefficients": [3.07403, 0.03231, 0, 0.03163, 1, 0, 0, 0, 1],
   "comments": "n<sub>α</sub>; 20 °C.",
   "formula": 4,
   "range": [0.48, 3.1],
   "references": "N. Umemura, K. Miyata, and K. Kato. New data on the optical properties of BiB<sub>3</sub>O<sub>6</sub>, <a href=\"https://doi.org/10.1016/j.optmat.2006.12.014\"><i>Opt. Mat.</i> <b>30</b>, 532-534 (2007)</a>",
   "source": "Umemura-alpha"
},
{
   "book": "BiB3O6",
   "coefficients": [3.1694, 0.03717, 0, 0.03483, 1, 0, 0, 0, 1],
   "comments": "n<sub>β</sub>; 20 °C.",
   "formula": 4,
   "range": [0.48, 3.1],
   "references": "N. Umemura, K. Miyata, and K. Kato. New data on the optical properties of BiB<sub>3</sub>O<sub>6</sub>, <a href=\"https://doi.org/10.1016/j.optmat.2006.12.014\"><i>Opt. Mat.</i> <b>30</b>, 532-534 (2007)</a>",
   "source": "Umemura-beta"
},
{
   "book": "BiB3O6",
   "coefficients": [3.6545, 0.05112, 0, 0.03713, 1, 0, 0, 0, 1],
   "comments": "n<sub>γ</sub>; 20 °C.",
   "formula": 4,
   "range": [0.48, 3.1],
   "references": "N. Umemura, K. Miyata, and K. Kato. New data on the optical properties of BiB<sub>3</sub>O<sub>6</sub>, <a href=\"https://doi.org/10.1016/j.optmat.2006.12.014\"><i>Opt. Mat.</i> <b>30</b>, 532-534 (2007)</a>",
   "source": "Umemura-gamma"
},
{
   "book": "CaF2",
   "coefficients": [0, 0.44375, 0.001780279, 0.4449301, 0.00788536, 0.150134, 0.01241195, 8.853199, 2752.282],
   "comments": "20 °C, Nitrogen atmosphere",
   "formula": 2,
   "range": [0.138, 2.326],
   "references": "M. Daimon and A. Masumura. High-accuracy measurements of the refractive index and its temperature coefficient of calcium fluoride in a wide wavelength range from 138 to 2326 nm, <a href=\"https://doi.org/10.1364/AO.41.005275\"><i>Appl. Opt.</i> <b>41</b>, 5275-5281 (2002)</a>",
   "source": "Daimon-20"
},
{
   "book": "CaF2",
   "coefficients": [0, 0.4373876, 0.001737993, 0.4492114, 0.007827186, 0.1520687, 0.01240861, 13.00204, 4039.765],
   "comments": "25 °C, Nitrogen atmosphere",
   "formula": 2,
   "range": [0.138, 2.326],
   "references": "M. Daimon and A. Masumura. High-accuracy measurements of the refractive index and its temperature coefficient of calcium fluoride in a wide wavelength range from 138 to 2326 nm, <a href=\"https://doi.org/10.1364/AO.41.005275\"><i>Appl. Opt.</i> <b>41</b>, 5275-5281 (2002)</a>",
   "source": "Daimon-25"
},
{
   "book": "CaF2",
   "coefficients": [0.33973, 0.69913, 0.09374, 0.11994, 21.18, 4.35181, 38.46],
   "comments": "293 K (20 °C).",
   "formula": 1,
   "range": [0.15, 12],
   "references": "H. H. Li. Refractive index of alkaline earth halides and its wavelength and temperature derivatives. <a href=\"https://doi.org/10.1063/1.555616\"><i>J. Phys. Chem. Ref. Data</i> <b>9</b>, 161-289 (1980)</a> and references therein.<br> <sup>*</sup> Sellmeier formula is derived by critical analysis of experimental data from several sources.",
   "source": "Li"
},
{
   "book": "CaF2",
   "coefficients": [0, 0.5675888, 0.05026361, 0.4710914, 0.1003909, 3.848472, 34.64904],
   "comments": "24 °C",
   "formula": 1,
   "range": [0.23, 9.7],
   "references": "I. H. Malitson. A redetermination of some optical properties of calcium fluoride, <a href=\"https://doi.org/doi:10.1364/AO.2.001103\"><i>Appl. Opt.</i> <b>2</b>, 1103-1107 (1963)</a>",
   "source": "Malitson"
},
{
   "book": "KNbO3",
   "coefficients": [4.4222, 0.09972, 0, 0.05496, 1, 0, 0, 0, 1],
   "comments": "n<sub>α</sub>; 22 °C.",
   "formula": 4,
   "range": [0.4, 5.3],
   "references": "N. Umemura, K. Yoshida, and K. Kato. Phase-matching properties of KNbO<sub>3</sub> in the mid-infrared, <a href=\"https://doi.org/10.1364/AO.38.000991\"><i>Appl Opt.</i> <b>38</b>, 991-994 (1999)</a>",
   "source": "Umemura-alpha"
},
{
   "book": "KNbO3",
   "coefficients": [4.8353, 0.12808, 0, 0.05674, 1, 0, 0, 0, 1],
   "comments": "n<sub>β</sub>; 22 °C.",
   "formula": 4,
   "range": [0.4, 5.3],
   "references": "N. Umemura, K. Yoshida, and K. Kato. Phase-matching properties of KNbO<sub>3</sub> in the mid-infrared, <a href=\"https://doi.org/10.1364/AO.38.000991\"><i>Appl Opt.</i> <b>38</b>, 991-994 (1999)</a>",
   "source": "Umemura-beta"
},
{
   "book": "KNbO3",
   "coefficients": [4.9856, 0.15266, 0, 0.06331, 1, 0, 0, 0, 1],
   "comments": "n<sub>γ</sub>; 22 °C.",
   "formula": 4,
   "range": [0.4, 5.3],
   "references": "N. Umemura, K. Yoshida, and K. Kato. Phase-matching properties of KNbO<sub>3</sub> in the mid-infrared, <a href=\"https://doi.org/10.1364/AO.38.000991\"><i>Appl Opt.</i> <b>38</b>, 991-994 (1999)</a>",
   "source": "Umemura-gamma"
},
{
   "book": "KTiOPO4",
   "coefficients": [3.291, 0.0414, 0, 0.03978, 1, 9.35522, 0, 31.45571, 1],
   "comments": "n<sub>α</sub>; 20 °C.",
   "formula": 4,
   "range": [0.43, 3.54],
   "references": "K. Kato and E. Takaoka. Sellmeier and thermo-optic dispersion formulas for KTP, <a href=\"https://doi.org/10.1364/AO.41.005040\"><i>Appl. Opt.</i> <b>41</b>, 5040-5044 (2002)</a>.",
   "source": "Kato-alpha"
},
{
   "book": "KTiOPO4",
   "coefficients": [3.45018, 0.04341, 0, 0.04597, 1, 16.98825, 0, 39.43799, 1],
   "comments": "n<sub>β</sub>; 20 °C.",
   "formula": 4,
   "range": [0.43, 3.54],
   "references": "K. Kato and E. Takaoka. Sellmeier and thermo-optic dispersion formulas for KTP, <a href=\"https://doi.org/10.1364/AO.41.005040\"><i>Appl. Opt.</i> <b>41</b>, 5040-5044 (2002)</a>.",
   "source": "Kato-beta"
},
{
   "book": "KTiOPO4",
   "coefficients": [4.59423, 0.06206, 0, 0.04763, 1, 110.8067, 0, 86.12171, 1],
   "comments": "n<sub>γ</sub>; 20 °C.",
   "formula": 4,
   "range": [0.43, 3.54],
   "references": "K. Kato and E. Takaoka. Sellmeier and thermo-optic dispersion formulas for KTP, <a href=\"https://doi.org/10.1364/AO.41.005040\"><i>Appl. Opt.</i> <b>41</b>, 5040-5044 (2002)</a>.",
   "source": "Kato-gamma"
},
{
   "book": "LaF3",
   "coefficients": [0, 1.5149, 0.0878],
   "comments": "Extraordinary ray (e)",
   "formula": 1,
   "range": [0.35, 0.7],
   "references": "R. Laihoa and M. Lakkistoa. Investigation of the refractive indices of LaF<sub>3</sub>, CeF<sub>3</sub>, PrF<sub>3</sub> and NdF<sub>3</sub>, <a href=\"https://doi.org/10.1080/13642818308226470\"><i>Phil. Mag. B</i> <b>48</b>, 203-207 (1983)</a> (As cited in Handbook of Optics, 2nd edition, Vol. 2. McGraw-Hill 1994).",
   "source": "Laihoa-e"
},
{
   "book": "LaF3",
   "coefficients": [0, 1.5376, 0.0881],
   "comments": "Ordinary ray (o)",
   "formula": 1,
   "range": [0.35, 0.7],
   "references": "R. Laihoa and M. Lakkistoa. Investigation of the refractive indices of LaF<sub>3</sub>, CeF<sub>3</sub>, PrF<sub>3</sub> and NdF<sub>3</sub>, <a href=\"https://doi.org/10.1080/13642818308226470\"><i>Phil. Mag. B</i> <b>48</b>, 203-207 (1983)</a> (As cited in Handbook of Optics, 2nd edition, Vol. 2. McGraw-Hill 1994).",
   "source": "Laihoa-o"
},
{
   "book": "LiNbO3",
   "coefficients": [0, 2.9804, 0.02047, 0.5981, 0.0666, 8.9543, 416.08],
   "comments": "21 °C. Extraordinary ray (e). Congruently grown lithium niobate.",
   "formula": 2,
   "range": [0.4, 5],
   "references": "D. E. Zelmon, D. L. Small, and D. Jundt. Infrared corrected Sellmeier coefficients for congruently grown lithium niobate and 5 mol.% magnesium oxide-doped lithium niobate, <a href=\"https://doi.org/10.1364/JOSAB.14.003319\"><i>J. Opt. Soc. Am. B</i> <b>14</b>, 3319-3322 (1997)</a>",
   "source": "Zelmon-e"
},
{
   "book": "LiNbO3",
   "coefficients": [0, 2.6734, 0.01764, 1.229, 0.05914, 12.614, 474.6],
   "comments": "21 °C. Ordinary ray (o). Congruently grown lithium niobate.",
   "formula": 2,
   "range": [0.4, 5],
   "references": "D. E. Zelmon, D. L. Small, and D. Jundt. Infrared corrected Sellmeier coefficients for congruently grown lithium niobate and 5 mol.% magnesium oxide-doped lithium niobate, <a href=\"https://doi.org/10.1364/JOSAB.14.003319\"><i>J. Opt. Soc. Am. B</i> <b>14</b>, 3319-3322 (1997)</a>",
   "source": "Zelmon-o"
},
{
   "book": "MgF2",
   "coefficients": [0, 0.4134402, 0.03684262, 0.504975, 0.09076162, 2.490486, 23.772],
   "comments": "19 °C. Extraordinary ray (e).",
   "formula": 1,
   "range": [0.2, 7],
   "references": "M. J. Dodge. Refractive properties of magnesium fluoride, <a href=\"https://doi.org/10.1364/AO.23.001980\"><i>Appl. Opt.</i> <b>23</b>, 1980-1985 (1984)</a>",
   "source": "Dodge-e"
},
{
   "book": "MgF2",
   "coefficients": [0, 0.4875511, 0.04338408, 0.3987503, 0.09461442, 2.312035, 23.7936],
   "comments": "19 °C. Ordinary ray (o).",
   "formula": 1,
   "range": [0.2, 7],
   "references": "M. J. Dodge. Refractive properties of magnesium fluoride, <a href=\"https://doi.org/10.1364/AO.23.001980\"><i>Appl. Opt.</i> <b>23</b>, 1980-1985 (1984)</a>",
   "source": "Dodge-o"
},
{
   "book": "MgF2",
   "coefficients": [0.25385, 0.66405, 0.08504, 1.0899, 22.2, 0.1816, 24.4, 2.1227, 40.6],
   "comments": "293 K (20 °C). Extraordinary ray (e).",
   "formula": 1,
   "range": [0.14, 7.5],
   "references": "H. H. Li. Refractive index of alkaline earth halides and its wavelength and temperature derivatives. <a href=\"https://doi.org/10.1063/1.555616\"><i>J. Phys. Chem. Ref. Data</i> <b>9</b>, 161-289 (1980)</a> and references therein.<br> <sup>*</sup> Sellmeier formula is derived by critical analysis of experimental data from several sources.",
   "source": "Li-e"
},
{
   "book": "MgF2",
   "coefficients": [0.2762, 0.60967, 0.08636, 0.008, 18, 2.14973, 25],
   "comments": "293 K (20 °C). Ordinary ray (o).",
   "formula": 1,
   "range": [0.14, 7.5],
   "references": "H. H. Li. Refractive index of alkaline earth halides and its wavelength and temperature derivatives. <a href=\"https://doi.org/10.1063/1.555616\"><i>J. Phys. Chem. Ref. Data</i> <b>9</b>, 161-289 (1980)</a> and references therein.<br> <sup>*</sup> Sellmeier formula is derived by critical analysis of experimental data from several sources.",
   "source": "Li-o"
},
{
   "book": "NaF",
   "coefficients": [0.41572, 0.32785, 0.117, 3.18248, 40.57],
   "comments": "297 K (24 °C).",
   "formula": 1,
   "range": [0.15, 17],
   "references": "H. H. Li. Refractive index of alkali halides and its wavelength and temperature derivatives. <a href=\"https://doi.org/10.1063/1.555536\"><i>J. Phys. Chem. Ref. Data</i> <b>5</b>, 329-528 (1976)</a> and references therein.<br> <sup>*</sup> Sellmeier formula is derived by critical analysis of experimental data from several sources.",
   "source": "Li"
},
{
   "book": "RbTiOPO4",
   "coefficients": [1.6795, 1.4281, 2, 0.0325, 1, 0, 0, 0, 1],
   "comments": "n<sub>α</sub>; 293 K (20 °C).",
   "formula": 4,
   "range": [0.4, 1.5],
   "references": "J. J. Carvajal, P. Segonds, A. Peña, J. Zaccaro, B. Boulanger, F. Díaz and M. Aguiló. Structural and optical properties of RbTiOPO<sub>4</sub>:Nb crystals , <a href=\"https://doi.org/10.1088/0953-8984/19/11/116214\"><i>J. Phys.: Condens. Matter</i> <b>19</b>, 116214, 2007</a>",
   "source": "Carvajal-alpha"
},
{
   "book": "RbTiOPO4",
   "coefficients": [2.036, 1.0883, 2, 0.0437, 1, 0, 0, 0, 1],
   "comments": "n<sub>β</sub>; 293 K (20 °C).",
   "formula": 4,
   "range": [0.4, 1.5],
   "references": "J. J. Carvajal, P. Segonds, A. Peña, J. Zaccaro, B. Boulanger, F. Díaz and M. Aguiló. Structural and optical properties of RbTiOPO<sub>4</sub>:Nb crystals , <a href=\"https://doi.org/10.1088/0953-8984/19/11/116214\"><i>J. Phys.: Condens. Matter</i> <b>19</b>, 116214, 2007</a>",
   "source": "Carvajal-beta"
},
{
   "book": "RbTiOPO4",
   "coefficients": [2.2864, 1.128, 2, 0.0562, 1, 0, 0, 0, 1],
   "comments": "n<sub>γ</sub>; 293 K (20 °C).",
   "formula": 4,
   "range": [0.4, 1.5],
   "references": "J. J. Carvajal, P. Segonds, A. Peña, J. Zaccaro, B. Boulanger, F. Díaz and M. Aguiló. Structural and optical properties of RbTiOPO<sub>4</sub>:Nb crystals , <a href=\"https://doi.org/10.1088/0953-8984/19/11/116214\"><i>J. Phys.: Condens. Matter</i> <b>19</b>, 116214, 2007</a>",
   "source": "Carvajal-gamma"
},
{
   "book": "N-BK7",
   "coefficients": [0, 1.039612, 0.006000699, 0.2317923, 0.02001791, 1.010469, 103.5607],
   "comments": "step 0.5 available",
   "formula": 2,
   "range": [0.3, 2.5],
   "references": "1) <a href=\"https://refractiveindex.info/download/data/2015/schott-optical-glass-collection-datasheets-july-2015-us.pdf\">SCHOTT optical glass data sheets 2015-07-22</a><br>2) <a href=\"https://refractiveindex.info/download/data/2015/schottzemax-20150722.agf\">SCHOTT Zemax catalog 2015-07-22</a>",
   "source": "Schott",
   "tabulated": [[0.3, 2.8607], [0.31, 1.3679], [0.32, 6.6608], [0.334, 2.6415], [0.35, 9.2894], [0.365, 3.4191], [0.37, 2.7405], [0.38, 2.074], [0.39, 1.3731], [0.4, 1.0227], [0.405, 9.0558], [0.42, 9.3912], [0.436, 1.1147], [0.46, 1.0286], [0.5, 9.5781], [0.546, 6.9658], [0.58, 9.2541], [0.62, 1.1877], [0.66, 1.2643], [0.7, 8.9305], [1.06, 1.0137], [1.53, 9.839], [1.97, 1.0933], [2.325, 4.2911], [2.5, 8.13], [6, 1.31]]
},
{
   "book": "N-LAF2",
   "coefficients": [0, 1.809842, 0.01017116, 0.1572956, 0.04424318, 1.093004, 100.6878],
   "formula": 2,
   "range": [0.35, 2.5],
   "references": "1) <a href=\"https://refractiveindex.info/download/data/2015/schott-optical-glass-collection-datasheets-july-2015-us.pdf\">SCHOTT optical glass data sheets 2015-07-22</a><br>2) <a href=\"https://refractiveindex.info/download/data/2015/schottzemax-20150722.agf\">SCHOTT Zemax catalog 2015-07-22</a>",
   "source": "Schott",
   "tabulated": [[0.35, 4.1097], [0.365, 1.3607], [0.37, 9.9398], [0.38, 5.5887], [0.39, 3.4069], [0.4, 2.2199], [0.405, 1.8696], [0.42, 1.1876], [0.436, 8.5873], [0.46, 5.6725], [0.5, 2.7289], [0.546, 1.0459], [0.58, 1.2969], [0.62, 1.5852], [0.66, 1.4758], [0.7, 8.9305], [1.06, 1.0137], [1.53, 4.8947], [1.97, 4.5507], [2.325, 2.7461], [2.5, 7.2916], [6, 9.2]]
},
{
   "book": "N-LAK8",
   "coefficients": [0, 1.331832, 0.006200239, 0.5466232, 0.02164654, 1.19084, 82.58277],
   "formula": 2,
   "range": [0.31, 2.5],
   "references": "1) <a href=\"https://refractiveindex.info/download/data/2015/schott-optical-glass-collection-datasheets-july-2015-us.pdf\">SCHOTT optical glass data sheets 2015-07-22</a><br>2) <a href=\"https://refractiveindex.info/download/data/2015/schottzemax-20150722.agf\">SCHOTT Zemax catalog 2015-07-22</a>",
   "source": "Schott",
   "tabulated": [[0.31, 4.5442], [0.32, 3.2787], [0.334, 1.794], [0.35, 8.4116], [0.365, 3.8167], [0.37, 2.9262], [0.38, 1.6845], [0.39, 1.1028], [0.4, 7.4725], [0.405, 6.3414], [0.42, 4.0721], [0.436, 2.9455], [0.46, 1.916], [0.5, 9.5781], [0.546, 8.7117], [0.58, 1.1111], [0.62, 1.1877], [0.66, 1.0531], [0.7, 8.9305], [1.06, 2.0305], [1.53, 1.0336], [1.97, 8.0161], [2.325, 6.4201], [2.5, 1.8323], [6, 1.25]]
},
{
   "book": "N-SF10",
   "coefficients": [0, 1.621539, 0.01222415, 0.2562878, 0.05957368, 1.644476, 147.4688],
   "formula": 2,
   "range": [0.38, 2.5],
   "references": "1) <a href=\"https://refractiveindex.info/download/data/2015/schott-optical-glass-collection-datasheets-july-2015-us.pdf\">SCHOTT optical glass data sheets 2015-07-22</a><br>2) <a href=\"https://refractiveindex.info/download/data/2015/schottzemax-20150722.agf\">SCHOTT Zemax catalog 2015-07-22</a>",
   "source": "Schott",
   "tabulated": [[0.38, 1.9467], [0.39, 9.9127], [0.4, 5.6823], [0.405, 4.5981], [0.42, 2.6531], [0.436, 1.9327], [0.46, 1.3809], [0.5, 9.0035], [0.546, 4.757], [0.58, 4.107], [0.62, 4.5921], [0.66, 5.1035], [0.7, 3.8205], [1.06, 3.3911], [1.53, 7.3606], [1.97, 4.5507], [2.325, 2.031], [2.5, 3.3066], [6, 7.41]]
},
{
   "book": "P-BK7",
   "coefficients": [0, 1.183185, 0.007221419, 0.08717564, 0.02682168, 1.031337, 101.7024],
   "comments": "suitable for precision molding",
   "formula": 2,
   "range": [0.31, 2.5],
   "references": "1) <a href=\"https://refractiveindex.info/download/data/2015/schott-optical-glass-collection-datasheets-july-2015-us.pdf\">SCHOTT optical glass data sheets 2015-07-22</a><br>2) <a href=\"https://refractiveindex.info/download/data/2015/schottzemax-20150722.agf\">SCHOTT Zemax catalog 2015-07-22</a>",
   "source": "Schott",
   "tabulated": [[0.31, 3.8602], [0.32, 1.4536], [0.334, 3.3459], [0.35, 8.085], [0.365, 3.1801], [0.37, 2.4996], [0.38, 1.7054], [0.39, 1.2477], [0.4, 1.0227], [0.405, 9.0558], [0.42, 8.0456], [0.436, 8.3521], [0.46, 7.3395], [0.5, 6.379], [0.546, 5.2218], [0.58, 5.5469], [0.62, 5.9295], [0.66, 6.312], [0.7, 6.6946], [1.06, 3.3758], [1.53, 1.0336], [1.97, 5.2286], [2.325, 2.6396], [2.5, 6.1794]]
},
{
   "book": "SF10",
   "coefficients": [0, 1.61626, 0.01275346, 0.2592293, 0.0581984, 1.077623, 116.6077],
   "comments": "lead containing glass type",
   "formula": 2,
   "range": [0.38, 2.5],
   "references": "1) <a href=\"https://refractiveindex.info/download/data/2015/schott-optical-glass-collection-datasheets-july-2015-us.pdf\">SCHOTT optical glass data sheets 2015-07-22</a><br>2) <a href=\"https://refractiveindex.info/download/data/2015/schottzemax-20150722.agf\">SCHOTT Zemax catalog 2015-07-22</a>",
   "source": "Schott",
   "tabulated": [[0.38, 3.403], [0.39, 1.2343], [0.4, 4.7245], [0.405, 3.0388], [0.42, 1.1147], [0.436, 5.5209], [0.46, 3.2573], [0.5, 1.7604], [0.546, 8.7117], [0.58, 9.2541], [0.62, 1.3863], [0.66, 1.4758], [0.7, 1.1169], [1.06, 1.0137], [1.53, 6.3727], [1.97, 5.2286], [2.325, 2.031], [2.5, 2.9528], [6, 1.59]]
},
{
   "book": "Y3Al5O12",
   "coefficients": [0, 2.282, 0.01185, 3.27644, 282.734],
   "formula": 2,
   "range": [0.4, 5],
   "references": "D. E. Zelmon, D. L. Small and R. Page. Refractive-index measurements of undoped yttrium aluminum garnet from 0.4 to 5.0 µm, <a href=\"https://doi.org/10.1364/AO.37.004933\"><i>Appl. Opt.</i> <b>37</b>, 4933-4935 (1998)</a>",
   "source": "Zelmon"
},
{
   "book": "YLiF4",
   "coefficients": [0.31021, 0.84903, 0.00876, 0.53607, 134.9566],
   "comments": "Room temperature. Extraordinary ray (e).",
   "formula": 2,
   "range": [0.225, 2.6],
   "references": "N. P. Barnes and D. J. Gettemy. Temperature variation of the refractive indices of yttrium lithium fluoride, <a href=\"https://doi.org/10.1364/JOSA.70.001244\"><i>J. Opt. Soc. Am.</i> <b>70</b>, 1244-1247 (1980)</a>",
   "source": "Barnes-e"
},
{
   "book": "YLiF4",
   "coefficients": [0.38757, 0.70757, 0.00931, 0.18849, 50.99741],
   "comments": "Room temperature. Ordinary ray (o).",
   "formula": 2,
   "range": [0.225, 2.6],
   "references": "N. P. Barnes and D. J. Gettemy. Temperature variation of the refractive indices of yttrium lithium fluoride, <a href=\"https://doi.org/10.1364/JOSA.70.001244\"><i>J. Opt. Soc. Am.</i> <b>70</b>, 1244-1247 (1980)</a>",
   "source": "Barnes-o"
},
{
   "book": "YVO4",
   "coefficients": [4.6072, 0.108087, 0, 0.052495, 1, 0, 0, 0, 1],
   "comments": "Extraordinary ray (e)",
   "formula": 4,
   "range": [0.48, 1.34],
   "references": "H. S. Shi, G. Zhang and H. Y. Shen. Measurement of principal refractive indices and the thermal refractive index coefficients of yttrium vanadate, <a href=\"http://caod.oriprobe.com/articles/3152847/Measurement_of_Principal_Refractive_Indices_and_the_Thermal_Refractive.htm\"><i>J. Synthetic Cryst.</i> <b>30</b>, 85-88 (2001)</a>, as cited in Handbook of Optics, 3rd edition, Vol. 4. McGraw-Hill 2009",
   "source": "Shi-e"
},
{
   "book": "YVO4",
   "coefficients": [3.77879, 0.07479, 0, 0.045731, 1, 0, 0, 0, 1],
   "comments": "Ordinary ray (o)",
   "formula": 4,
   "range": [0.48, 1.34],
   "references": "H. S. Shi, G. Zhang and H. Y. Shen. Measurement of principal refractive indices and the thermal refractive index coefficients of yttrium vanadate, <a href=\"http://caod.oriprobe.com/articles/3152847/Measurement_of_Principal_Refractive_Indices_and_the_Thermal_Refractive.htm\"><i>J. Synthetic Cryst.</i> <b>30</b>, 85-88 (2001)</a>, as cited in Handbook of Optics, 3rd edition, Vol. 4. McGraw-Hill 2009",
   "source": "Shi-o"
},
{
   "book": "ZnS",
   "coefficients": [8.393, 0.14383, 0, 0.2421, 2, 4430.99, 0, 36.71, 2],
   "comments": "Cubic ZnS, 20 °C",
   "formula": 4,
   "range": [0.405, 13],
   "references": "1) M. Debenham. Refractive indices of zinc sulfide in the 0.405-13-µm wavelength range, <a href=\"https://doi.org/10.1364/AO.23.002238\"><i>Appl. Opt.</i>, <b>23</b>, 2238-2239 (1984)</a><br>2) C. A. Klein. Room-temperature dispersion equations for cubic zinc sulfide, <a href=\"https://doi.org/10.1364/AO.25.001873\"><i>Appl. Opt.</i> <b>25</b>, 1873-1875 (1986)</a><br>*Ref. 2 provides a modified Sellmeier equation based on the data from Ref. 1",
   "source": "Debenham"
},
{
   "book": "ZnSe",
   "coefficients": [0, 4.458138, 0.2008599, 0.4672163, 0.3913712, 2.895663, 47.13621],
   "comments": "CVD ZnSe, 23 °C",
   "formula": 1,
   "range": [0.54, 18.2],
   "references": "1) J. Connolly, B. diBenedetto, and R. Donadio. Specifications of Raytran material, <a href=\"https://doi.org/10.1117/12.957359\"><i>Proc. SPIE</i>, <b>181</b>, 141-144 (1979)</a><br>2) B. Tatian. Fitting refractive-index data with the Sellmeier dispersion formula, <a href=\"https://doi.org/10.1364/AO.23.004477\"><i>Appl. Opt.</i> <b>23</b>, 4477-4485 (1984)</a><br>*Ref. 2 provides Sellmeier equation based on the data from Ref. 1",
   "source": "Connolly"
},
{
   "book": "ZnSe",
   "coefficients": [3, 1.9, 0.113],
   "comments": "Room temperature",
   "formula": 2,
   "range": [0.48, 2.5],
   "references": "D. T. F. Marple. Refractive index of ZnSe, ZnTe, and CdTe, <a href=\"https://doi.org/10.1063/1.1713411\"><i>J. Appl. Phys.</i> <b>35</b>, 539-542 (1964)</a>",
   "source": "Marple"
}];
   };
   set();
}(window.LaserCanvas));