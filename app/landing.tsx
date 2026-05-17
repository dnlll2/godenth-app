import { useRef, useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Platform, Animated, useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import Svg, { Path, G } from 'react-native-svg'
import { useFonts, Poppins_800ExtraBold, Poppins_600SemiBold, Poppins_400Regular } from '@expo-google-fonts/poppins'

const TEAL    = '#1c909b'
const GOLD    = '#C49800'
const BG      = '#FAFAF8'
const HERO_BG = '#0d2d35'
const DARK    = '#0a2228'
const MUTED   = '#4A6E5E'
const BORDER  = '#D8ECE4'

// ─── Brazil states SVG paths (viewBox 0 0 800 900) ──────────────────────────
// Source: IBGE/TopoJSON → equirectangular projection
const STATE_PATHS: Record<string, string> = {
  AC: 'M 1.9,286.4 L 73.1,310.1 L 145.1,348.8 L 149.4,350.7 L 109.6,378.7 L 67.1,376.2 L 67.4,341.3 L 54.3,353.5 L 35.8,352.5 L 31.5,339.7 L 14.4,339.2 L 20.6,331.4 L 8.2,313.9 L 3.4,304.2 L 3.3,301.2 L -1.5,297.2 L -1.6,291.4 L 2.3,291.4 Z',
  AL: 'M 793.5,327.2 L 788.7,335.7 L 780.7,345.8 L 774.4,355 L 769.4,360 L 769.4,361.1 L 767.4,364.5 L 766.2,362.3 L 763.9,362.6 L 763.8,360.5 L 762.4,358.9 L 761.2,359.6 L 756.1,355.2 L 755.9,353.2 L 734.7,341.5 L 729.9,337.4 L 738.8,326.6 L 756.1,338.9 L 757.2,336.3 L 761.3,336.4 L 762.9,338.1 L 776.2,326.5 L 781.5,328 L 785.1,325.8 Z',
  AP: 'M 486.2,107.3 L 453.9,139.1 L 454.9,148.2 L 441.1,149.4 L 415.1,93.4 L 400,82.2 L 391.6,82.2 L 388.9,65.3 L 393.4,65.1 L 397.9,71.7 L 406,72.3 L 410.8,67.9 L 420.7,68.2 L 422.8,71.8 L 430.2,71.8 L 460.9,19.4 L 472.6,68.9 L 491.9,84.9 L 491.5,98.8 Z',
  AM: 'M 215,71.5 L 228.5,79.7 L 238.1,129.9 L 233.2,140.1 L 254,158.5 L 251.9,141.3 L 260.5,133.3 L 270.3,142.6 L 278.4,138 L 276.1,133.9 L 283.3,116.6 L 306.8,116 L 307.4,131.7 L 318.7,148.7 L 358.9,174.2 L 316.9,279.3 L 321.9,291.1 L 316.9,325 L 252.8,325.5 L 240.5,324.8 L 226.1,306.5 L 211.4,306.6 L 196.9,328.1 L 184.1,328.4 L 184.2,340.2 L 155.4,339.7 L 145.1,348.8 L 73.1,310.1 L 1.9,286.4 L 4.1,277.6 L 15.4,271.6 L 12.8,261.7 L 22.2,240.2 L 49.5,224.1 L 80.6,221.6 L 91.8,145.5 L 79.2,126.4 L 78.9,108.8 L 97.1,108.3 L 97.1,98 L 83,98.2 L 83,82.6 L 116.4,82.3 L 131.7,72.3 L 139,80.2 L 139.4,95.4 L 171,107.4 Z',
  BA: 'M 729.9,337.4 L 734.7,341.5 L 735,352.2 L 738.3,352.8 L 740.1,360.8 L 737.9,361.9 L 737.9,369.3 L 734.3,370.6 L 733.6,369.3 L 730.5,369.4 L 729.1,372 L 734.4,384.2 L 745.5,390.4 L 727,422.8 L 723,419.8 L 715.3,427.8 L 712.9,462.9 L 717,488.3 L 708,520.7 L 711.3,530.1 L 708.5,534.8 L 703.6,537.2 L 700.4,545.4 L 687.9,536.2 L 689.5,531.6 L 680.9,523.2 L 683.5,512.2 L 688.2,511.4 L 694.4,491.5 L 607.4,450.8 L 570.1,473.6 L 570.3,465.1 L 565.7,421.3 L 559.3,383.5 L 574.6,358.9 L 586.3,372 L 609,367.7 L 618.6,353.9 L 614.8,342.7 L 622.3,336.1 L 637.1,344.2 L 647.8,335.9 L 655.2,335.9 L 667.9,322 L 678.6,333.3 L 678.4,339.6 L 685.5,339.8 L 705.7,318.9 L 720.9,329.6 L 723.8,326.5 L 728.5,330.8 L 727.1,333.5 Z',
  CE: 'M 748.8,233.4 L 742,236.5 L 722.9,269 L 718.9,282.7 L 723.5,290.5 L 720,301.1 L 711.4,301.1 L 700,291.5 L 682.4,292.9 L 685.6,278.5 L 679.4,275.7 L 672.3,235.4 L 666.5,189.5 L 656.3,185 L 666.5,189.5 L 693.2,187.8 L 724.9,207.6 L 736.7,222.3 L 748.8,229.8 Z',
  DF: 'M 544,492.6 L 524.2,492.6 L 524.2,480.1 L 544,480.2 Z',
  ES: 'M 674.6,614.1 L 658.5,609.7 L 658.5,603.1 L 655,602 L 657,588.6 L 665.2,588.2 L 675.2,566.9 L 671.9,562 L 674.4,555.5 L 669,545.8 L 673.8,541.1 L 677.8,541.2 L 681.1,536.3 L 687.9,536.2 L 700.4,545.4 L 697.6,555.6 L 699.9,568.4 L 697.6,575.4 L 692,579.8 L 689,589.9 L 682.1,603.3 L 677.7,603.6 Z',
  GO: 'M 477.1,417.6 L 502.7,426.3 L 565.7,421.3 L 570.3,465.1 L 553.6,468.1 L 554.3,488.6 L 544,492.6 L 544,480.2 L 524.2,480.1 L 524.2,492.6 L 544,492.6 L 544.6,539 L 532.6,549.9 L 524.6,545.6 L 509.1,545.7 L 501.2,553.3 L 482.6,553.8 L 469.7,571.7 L 431,552.1 L 425.9,537.6 L 422.5,529.3 L 427.4,510.8 L 442.6,489 L 451.5,487.3 L 456,470.1 L 466.5,468.1 Z',
  MA: 'M 518.8,241.5 L 539.1,227.2 L 552.8,204.6 L 569.3,146.2 L 596,157.5 L 603.1,177.1 L 611.7,180.3 L 621,173.6 L 642.3,185.4 L 656.4,185.2 L 632.5,220 L 633.9,276.2 L 622.5,281.3 L 619.4,275.7 L 610,279.5 L 600,291.3 L 582,299.3 L 571.7,326.7 L 574.6,358.9 L 562.8,355.7 L 558.9,346.2 L 549.5,330.1 L 554.4,315.3 L 561,314.2 L 559.9,304 L 549.5,306.7 L 536.6,289.2 L 542.8,266.7 L 540.1,248.7 Z',
  MG: 'M 694.4,491.5 L 688.2,511.4 L 683.5,512.2 L 680.9,523.2 L 689.5,531.6 L 687.9,536.2 L 681.1,536.3 L 677.8,541.2 L 673.8,541.1 L 669,545.8 L 674.4,555.5 L 671.9,562 L 675.2,566.9 L 665.2,588.2 L 657,588.6 L 655,602 L 653.5,606 L 650.8,606 L 645.3,621.4 L 646.4,623.5 L 630.5,632.1 L 625.1,629.4 L 596.4,639.3 L 563.8,650.9 L 541.1,583.5 L 469.2,582 L 469.7,571.7 L 482.6,553.8 L 501.2,553.3 L 509.1,545.7 L 524.6,545.6 L 532.6,549.9 L 544.6,539 L 544,492.6 L 554.3,488.6 L 553.6,468.1 L 570.3,465.1 L 570.1,473.6 L 607.5,451.1 Z',
  MS: 'M 425.9,537.6 L 431,552.1 L 469.7,571.7 L 469.2,582 L 438.7,634 L 425.7,643.5 L 415.6,651.5 L 408.1,663.1 L 402.1,677 L 393.1,673.8 L 379.6,676.1 L 369.7,636.2 L 326.3,634.8 L 326.9,606.1 L 320.2,582.8 L 336.2,535.9 L 352.1,522.3 L 367,518.3 L 384.6,529.5 L 405,529 L 413.6,518.9 L 413.5,529.5 L 405.8,537.6 Z',
  MT: 'M 270.6,438.4 L 287.7,406.2 L 287.8,376.3 L 252.7,375.8 L 252.8,325.5 L 316.9,325 L 321.9,291.1 L 350.8,339.3 L 484.4,349.4 L 473.9,386.2 L 477.1,417.6 L 466.5,468.1 L 456,470.1 L 451.5,487.3 L 442.6,489 L 427.4,510.8 L 422.5,529.3 L 425.9,537.6 L 405.8,537.6 L 413.5,529.5 L 413.6,518.9 L 405,529 L 384.6,529.5 L 367,518.3 L 352.1,522.3 L 336.2,535.9 L 318.8,520.7 L 318.8,497.6 L 280.9,497.7 L 280.6,480 L 272.6,470 L 279.4,470.3 L 279,459.2 L 276.3,445.8 Z',
  PA: 'M 569.3,146.2 L 552.8,204.6 L 539.1,227.2 L 518.8,241.5 L 514.5,245.8 L 526,251.1 L 514.9,277.5 L 508.8,279.3 L 501.6,297.4 L 506.1,302.7 L 484.4,349.4 L 350.8,339.3 L 321.9,291.1 L 316.9,279.3 L 358.9,174.2 L 318.7,148.7 L 307.4,131.7 L 306.8,116 L 307.3,92.7 L 342.9,78.1 L 365.9,77.2 L 365,65.1 L 388.9,65.3 L 391.6,82.2 L 400,82.2 L 415.1,93.4 L 441.1,149.4 L 454.9,148.2 L 453.9,139.1 L 486.2,107.3 L 489.4,114.8 L 497.1,114.1 L 521,128.2 L 521.4,133.9 L 531,137.7 L 537.1,132.3 Z',
  PB: 'M 796.5,272 L 799.6,296.4 L 794.6,292.9 L 786.2,294.5 L 785,298.9 L 775.4,302.9 L 770.5,302 L 763.5,305.2 L 762.9,310.1 L 755.2,314.1 L 748.4,305.4 L 755.8,294.4 L 749.4,290 L 735.2,300.6 L 720,301.1 L 723.5,290.5 L 718.9,282.7 L 722.9,269 L 732.3,272.1 L 749.6,260.4 L 751.6,264 L 745.2,276.4 L 761.1,283.4 L 767.8,271.6 Z',
  PE: 'M 799.6,296.4 L 793.5,327.2 L 785.1,325.8 L 781.5,328 L 776.2,326.5 L 762.9,338.1 L 761.3,336.4 L 757.2,336.3 L 756.1,338.9 L 738.8,326.6 L 729.9,337.4 L 727.1,333.5 L 728.5,330.8 L 723.8,326.5 L 720.9,329.6 L 705.7,318.9 L 685.5,339.8 L 678.4,339.6 L 678.6,333.3 L 667.9,322 L 682.4,308.3 L 682.3,302.7 L 678.9,301.3 L 679,294.6 L 682.4,292.9 L 700,291.5 L 711.4,301.1 L 720,301.1 L 735.2,300.6 L 749.4,290 L 755.8,294.4 L 748.4,305.4 L 755.2,314.1 L 762.9,310.1 L 763.5,305.2 L 770.5,302 L 775.4,302.9 L 785,298.9 L 786.2,294.5 L 794.6,292.9 Z',
  PI: 'M 656.4,185.2 L 666.5,189.5 L 672.3,235.4 L 679.4,275.7 L 685.6,278.5 L 682.4,292.9 L 679,294.6 L 678.9,301.3 L 682.3,302.7 L 682.4,308.3 L 667.9,322 L 655.2,335.9 L 647.8,335.9 L 637.1,344.2 L 622.3,336.1 L 614.8,342.7 L 618.6,353.9 L 609,367.7 L 586.3,372 L 574.6,358.9 L 571.7,326.7 L 582,299.3 L 600,291.3 L 610,279.5 L 619.4,275.7 L 622.5,281.3 L 633.9,276.2 L 632.5,220 Z',
  PR: 'M 425.7,643.5 L 493.9,654.4 L 505.3,689.3 L 529.4,704.6 L 517.7,721.9 L 506,721.9 L 498.8,727.1 L 491,722.8 L 477,722.9 L 474.2,727.5 L 463.2,729.2 L 460.8,736.9 L 414.5,728.3 L 408.2,714 L 395.1,713 L 402.1,677 L 408.1,663.1 L 415.6,651.5 Z',
  RJ: 'M 596.6,661.4 L 594.1,653.2 L 607.2,647.9 L 605.5,643.4 L 600,645.4 L 596.4,639.3 L 625.1,629.4 L 630.5,632.1 L 646.4,623.5 L 645.3,621.4 L 650.8,606 L 653.5,606 L 655,602 L 658.5,603.1 L 658.5,609.7 L 674.6,614.1 L 671.8,619 L 673.6,629.8 L 668.6,633 L 661.7,635.6 L 652.9,643.8 L 655.3,646.8 L 652.1,651.8 L 631.8,652.4 L 620.3,654.4 L 614.9,651.3 L 599.5,657.3 L 600.4,660.1 Z',
  RN: 'M 748.8,233.4 L 761.7,239.6 L 776.3,238.8 L 788.5,242.7 L 796.5,272 L 767.8,271.6 L 761.1,283.4 L 745.2,276.4 L 751.6,264 L 749.6,260.4 L 732.3,272.1 L 722.9,269 L 742,236.5 Z',
  RO: 'M 145.1,348.8 L 155.4,339.7 L 184.2,340.2 L 184.1,328.4 L 196.9,328.1 L 211.4,306.6 L 226.1,306.5 L 240.5,324.8 L 252.8,325.5 L 252.7,375.8 L 287.8,376.3 L 287.7,406.2 L 270.6,438.4 L 263.2,434 L 246.3,434.7 L 239.9,426.6 L 206.4,408.9 L 198.3,412.4 L 175.7,392.7 L 175.8,350.9 L 149.4,350.7 Z',
  RR: 'M 307.3,92.7 L 306.8,116 L 283.3,116.6 L 276.1,133.9 L 278.4,138 L 270.3,142.6 L 260.5,133.3 L 251.9,141.3 L 254,158.5 L 233.2,140.1 L 238.1,129.9 L 228.5,79.7 L 215,71.5 L 214.7,66.6 L 202.8,66.7 L 198.2,39.9 L 185.1,24.8 L 187,23.1 L 190.9,27 L 200.3,27.6 L 202.9,32.1 L 219.3,31.3 L 223.3,39 L 228.9,37.2 L 226.5,30.7 L 236.7,26 L 242.6,27.7 L 269.7,12 L 269.4,1.5 L 284.1,1.2 L 284.6,17.8 L 292,21 L 292.3,34.5 L 285.1,53.1 L 285.5,67.8 L 289.6,69.4 L 289.7,79.1 L 300,90.8 Z',
  RS: 'M 410.5,749.3 L 452.8,755 L 477.4,776.9 L 492.1,781.3 L 488.5,793.2 L 493.9,798.6 L 483.1,825.9 L 472.5,841.9 L 464.5,849.8 L 446.7,864 L 446.7,857 L 450.6,857 L 460.2,849.4 L 475,826.4 L 464.7,824.2 L 454.8,843.3 L 442.7,857 L 445.9,859 L 445.9,864.4 L 441.1,870.5 L 437,884 L 432.5,890.3 L 419.9,901.1 L 416.7,898 L 419.1,889.9 L 427.3,878.8 L 431.7,881.8 L 435.9,871.9 L 432.3,869.3 L 423.6,875.5 L 376,835.4 L 366.9,840 L 337.8,815.7 L 373.7,771.5 Z',
  SC: 'M 414.5,728.3 L 460.8,736.9 L 463.2,729.2 L 474.2,727.5 L 477,722.9 L 491,722.8 L 498.8,727.1 L 506,721.9 L 517.7,721.9 L 520.1,727.7 L 516.1,738.7 L 518.1,753.7 L 518,765.1 L 514.7,780.2 L 493.9,798.6 L 488.5,793.2 L 492.1,781.3 L 477.4,776.9 L 452.8,755 L 410.5,749.3 Z',
  SE: 'M 734.7,341.5 L 755.9,353.2 L 756.1,355.2 L 761.2,359.6 L 762.4,358.9 L 763.8,360.5 L 763.9,362.6 L 766.2,362.3 L 767.4,364.5 L 766.8,365.5 L 764.5,365.5 L 756.9,371.4 L 745.5,390.4 L 734.4,384.2 L 729.1,372 L 730.5,369.4 L 733.6,369.3 L 734.3,370.6 L 737.9,369.3 L 737.9,361.9 L 740.1,360.8 L 738.3,352.8 L 735,352.2 Z',
  SP: 'M 596.6,661.4 L 582.6,668 L 583.7,670.3 L 580.8,672.5 L 576.1,670.7 L 570.2,671.7 L 553.6,681.2 L 529.4,704.6 L 505.3,689.3 L 493.9,654.4 L 425.7,643.5 L 438.7,634 L 469.2,582 L 541.1,583.5 L 563.8,650.9 L 596.4,639.3 L 600,645.4 L 605.5,643.4 L 607.2,647.9 L 594.1,653.2 Z',
  TO: 'M 574.6,358.9 L 559.3,383.5 L 565.7,421.3 L 502.7,426.3 L 477.1,417.6 L 473.9,386.2 L 484.4,349.4 L 506.1,302.7 L 501.6,297.4 L 508.8,279.3 L 514.9,277.5 L 526,251.1 L 514.5,245.8 L 518.8,241.5 L 540.1,248.7 L 542.8,266.7 L 536.6,289.2 L 549.5,306.7 L 559.9,304 L 561,314.2 L 554.4,315.3 L 549.5,330.1 L 558.9,346.2 L 562.8,355.7 Z',
}

const MAP_W = 800
const MAP_H = 900

// 28 cities across all 5 regions
const CITIES = [
  // Norte
  { name: 'Manaus',        x: 284, y: 194, delay: 0 },
  { name: 'Belém',         x: 520, y: 156, delay: 200 },
  { name: 'Macapá',        x: 467, y: 122, delay: 400 },
  { name: 'Boa Vista',     x: 271, y: 57,  delay: 600 },
  { name: 'Porto Velho',   x: 205, y: 325, delay: 800 },
  { name: 'Rio Branco',    x: 125, y: 353, delay: 1000 },
  { name: 'Palmas',        x: 523, y: 357, delay: 1200 },
  { name: 'Santarém',      x: 392, y: 179, delay: 1400 },
  // Nordeste
  { name: 'São Luís',      x: 606, y: 181, delay: 1600 },
  { name: 'Teresina',      x: 636, y: 240, delay: 1800 },
  { name: 'Fortaleza',     x: 724, y: 208, delay: 2000 },
  { name: 'Natal',         x: 792, y: 256, delay: 2200 },
  { name: 'João Pessoa',   x: 799, y: 287, delay: 2400 },
  { name: 'Recife',        x: 799, y: 309, delay: 2600 },
  { name: 'Maceió',        x: 781, y: 346, delay: 2800 },
  { name: 'Aracaju',       x: 753, y: 374, delay: 3000 },
  { name: 'Salvador',      x: 724, y: 422, delay: 3200 },
  { name: 'Feira de Sant.', x: 714, y: 406, delay: 3400 },
  // Centro-Oeste
  { name: 'Brasília',      x: 531, y: 487, delay: 3600 },
  { name: 'Goiânia',       x: 504, y: 508, delay: 3800 },
  { name: 'Cuiabá',        x: 364, y: 483, delay: 4000 },
  { name: 'Campo Grande',  x: 394, y: 594, delay: 4200 },
  // Sudeste
  { name: 'Belo Horizonte', x: 613, y: 582, delay: 4400 },
  { name: 'Vitória',        x: 686, y: 591, delay: 4600 },
  { name: 'Rio de Janeiro', x: 629, y: 651, delay: 4800 },
  { name: 'São Paulo',      x: 558, y: 666, delay: 5000 },
  // Sul
  { name: 'Curitiba',       x: 503, y: 710, delay: 5200 },
  { name: 'Florianópolis',  x: 519, y: 759, delay: 5400 },
  { name: 'Porto Alegre',   x: 464, y: 815, delay: 5600 },
  { name: 'Joinville',      x: 512, y: 730, delay: 5800 },
]

const BENEFICIOS = [
  { icon: '🤝', titulo: 'Conecte-se', desc: 'Construa sua rede com dentistas, técnicos, clínicas e laboratórios de todo o Brasil.' },
  { icon: '💼', titulo: 'Encontre vagas', desc: 'Vagas exclusivas para odontologia. Candidature-se em poucos toques.' },
  { icon: '🏆', titulo: 'Portfólio profissional', desc: 'Publique seus casos clínicos e seja encontrado por clínicas e parceiros.' },
  { icon: '🏢', titulo: 'Páginas de empresa', desc: 'Crie a presença digital da sua clínica, laboratório ou escola odontológica.' },
]

const NUMEROS = [
  { valor: '2.800+', label: 'Profissionais' },
  { valor: '340+',   label: 'Vagas abertas' },
  { valor: '15k+',   label: 'Conexões' },
  { valor: '420+',   label: 'Clínicas' },
]

// ─── Pulsing dot ────────────────────────────────────────────────────────────

function PulsingDot({ city, mapW, mapH }: { city: typeof CITIES[0]; mapW: number; mapH: number }) {
  const ring = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (mapW === 0) return
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.delay(city.delay % 2000),
        Animated.timing(ring, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: false }),
        Animated.delay(2000),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [mapW])

  const left = (city.x / MAP_W) * mapW - 5
  const top  = (city.y / MAP_H) * mapH - 5

  const ringScale   = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 4] })
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.8, 0.3, 0] })

  return (
    <View style={[dot.wrap, { left, top }]} pointerEvents="none">
      <Animated.View style={[dot.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
      <View style={dot.core} />
    </View>
  )
}

const dot = StyleSheet.create({
  wrap: { position: 'absolute', width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD },
  core: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD, zIndex: 2 },
})

// ─── Brazil Map ─────────────────────────────────────────────────────────────

function BrazilMap({ size }: { size: number }) {
  const [mapDims, setMapDims] = useState({ w: 0, h: 0 })
  const aspect = MAP_H / MAP_W
  const mapH = size * aspect

  return (
    <View
      style={{ width: size, height: mapH }}
      onLayout={e => setMapDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width={size} height={mapH}>
        <G>
          {Object.entries(STATE_PATHS).map(([uf, d]) => (
            <Path key={uf + '_glow'} d={d} fill={TEAL + '18'} stroke="none" />
          ))}
          {Object.entries(STATE_PATHS).map(([uf, d]) => (
            <Path
              key={uf}
              d={d}
              fill={TEAL + '28'}
              stroke={'#7dd4dc'}
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
          ))}
        </G>
      </Svg>
      {mapDims.w > 0 && CITIES.map(city => (
        <PulsingDot key={city.name} city={city} mapW={mapDims.w} mapH={mapDims.h} />
      ))}
    </View>
  )
}

// ─── Landing Page ────────────────────────────────────────────────────────────

export default function Landing() {
  const { width } = useWindowDimensions()
  const isWide = Platform.OS === 'web' && width > 768

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_600SemiBold,
    Poppins_400Regular,
  })

  const mapSize = isWide ? Math.min(width * 0.42, 460) : Math.min(width - 32, 340)

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={[s.logo, fontsLoaded && { fontFamily: 'Poppins_800ExtraBold' }]}>
          <Text style={s.logoGo}>Go</Text>
          <Text style={s.logoDenth}>Denth</Text>
        </Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={s.headerLogin}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.headerCta} onPress={() => router.push('/(auth)/cadastro' as any)}>
            <Text style={s.headerCtaT}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── HERO ── */}
      <View style={[s.hero, isWide && s.heroWide]}>
        <View style={[s.heroLeft, isWide && s.heroLeftWide]}>
          <View style={s.badge}>
            <Text style={s.badgeT}>🦷 Rede exclusiva para odontologia</Text>
          </View>

          <Text style={[s.heroTitle, fontsLoaded && { fontFamily: 'Poppins_800ExtraBold' }, isWide && s.heroTitleWide]}>
            <Text style={s.heroTitleGold}>CONECTE.</Text>{'\n'}
            <Text style={s.heroTitleWhite}>ENCONTRE.</Text>{'\n'}
            <Text style={s.heroTitleTeal}>CRESÇA.</Text>
          </Text>

          <Text style={[s.heroSub, isWide && s.heroSubWide]}>
            A plataforma onde profissionais da odontologia se conectam, encontram oportunidades e constroem carreiras de verdade.
          </Text>

          <View style={[s.heroButtons, isWide && s.heroButtonsWide]}>
            <TouchableOpacity style={s.btnPrimary} onPress={() => router.push('/(auth)/cadastro' as any)}>
              <Text style={[s.btnPrimaryT, fontsLoaded && { fontFamily: 'Poppins_600SemiBold' }]}>Criar conta grátis</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnOutline} onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={[s.btnOutlineT, fontsLoaded && { fontFamily: 'Poppins_600SemiBold' }]}>Já tenho conta →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[s.mapWrap, isWide && s.mapWrapWide]}>
          <View style={[s.mapGlow, { width: mapSize * 0.9, height: mapSize * (MAP_H / MAP_W) * 0.9 }]} />
          <BrazilMap size={mapSize} />
        </View>
      </View>

      {/* ── NÚMEROS ── */}
      <View style={s.numSection}>
        <View style={[s.numRow, isWide && s.numRowWide]}>
          {NUMEROS.map((n, i) => (
            <View key={n.label} style={[s.numCard, i < NUMEROS.length - 1 && s.numCardBorder]}>
              <Text style={[s.numValor, fontsLoaded && { fontFamily: 'Poppins_800ExtraBold' }]}>{n.valor}</Text>
              <Text style={s.numLabel}>{n.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── BENEFÍCIOS ── */}
      <View style={s.benefSection}>
        <Text style={[s.sectionTitle, fontsLoaded && { fontFamily: 'Poppins_800ExtraBold' }, isWide && s.sectionTitleWide]}>
          Tudo que você precisa, em um só lugar
        </Text>
        <Text style={s.sectionSub}>Feito para cada profissional da odontologia brasileira</Text>
        <View style={[s.benefGrid, isWide && s.benefGridWide]}>
          {BENEFICIOS.map(b => (
            <View key={b.titulo} style={[s.benefCard, isWide && s.benefCardWide]}>
              <Text style={s.benefIcon}>{b.icon}</Text>
              <Text style={[s.benefTitulo, fontsLoaded && { fontFamily: 'Poppins_600SemiBold' }]}>{b.titulo}</Text>
              <Text style={s.benefDesc}>{b.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={s.ctaSection}>
        <Text style={[s.ctaTitle, fontsLoaded && { fontFamily: 'Poppins_800ExtraBold' }, isWide && s.ctaTitleWide]}>
          Faça parte da maior rede odontológica do Brasil
        </Text>
        <Text style={s.ctaSub}>Gratuito para começar · Sem cartão de crédito</Text>
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/(auth)/cadastro' as any)}>
          <Text style={[s.ctaBtnT, fontsLoaded && { fontFamily: 'Poppins_600SemiBold' }]}>
            Criar minha conta grátis
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── FOOTER ── */}
      <View style={s.footer}>
        <Text style={[s.footerLogo, fontsLoaded && { fontFamily: 'Poppins_800ExtraBold' }]}>
          <Text style={{ color: GOLD }}>Go</Text>
          <Text style={{ color: '#fff' }}>Denth</Text>
        </Text>
        <Text style={s.footerSub}>A rede profissional da odontologia brasileira</Text>
        <Text style={s.footerCopy}>© 2025 GoDenth · Todos os direitos reservados</Text>
      </View>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  content: { flexGrow: 1 },

  // Header — same teal as rest of app
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: TEAL,
  },
  logo: { fontSize: 24, letterSpacing: 0.5 },
  logoGo:    { color: GOLD },
  logoDenth: { color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerLogin: { color: 'rgba(255,255,255,0.88)', fontSize: 14, fontWeight: '600' },
  headerCta:   { borderWidth: 1.5, borderColor: GOLD, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 7 },
  headerCtaT:  { color: GOLD, fontSize: 13, fontWeight: '700' },

  // Hero — dark teal background
  hero: { backgroundColor: HERO_BG, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 48, alignItems: 'center' },
  heroWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 60, gap: 40, paddingTop: 60, paddingBottom: 60 },
  heroLeft: { alignItems: 'center', width: '100%' },
  heroLeftWide: { alignItems: 'flex-start', flex: 1, maxWidth: 500 },
  badge:  { backgroundColor: TEAL + '30', borderWidth: 1, borderColor: TEAL + '70', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 22 },
  badgeT: { color: '#7dd4dc', fontSize: 12, fontWeight: '700' },
  heroTitle:      { fontSize: 36, fontWeight: '900', lineHeight: 46, textAlign: 'center', marginBottom: 16 },
  heroTitleWide:  { fontSize: 52, lineHeight: 66, textAlign: 'left' },
  heroTitleGold:  { color: GOLD },
  heroTitleWhite: { color: '#FFFFFF' },
  heroTitleTeal:  { color: '#7dd4dc' },
  heroSub:     { color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 380, marginBottom: 28 },
  heroSubWide: { fontSize: 16, textAlign: 'left', maxWidth: 440, lineHeight: 26 },
  heroButtons:     { flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 },
  heroButtonsWide: { flexDirection: 'row', width: 'auto', maxWidth: undefined },
  mapWrap:     { marginTop: 36, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  mapWrapWide: { marginTop: 0, flexShrink: 0 },
  mapGlow: { position: 'absolute', borderRadius: 300, backgroundColor: TEAL, opacity: 0.08, transform: [{ scale: 1.3 }] },

  // Buttons
  btnPrimary:  { backgroundColor: GOLD, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryT: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnOutline:  { borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  btnOutlineT: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Numbers
  numSection: { backgroundColor: DARK, paddingVertical: 32, paddingHorizontal: 16 },
  numRow:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  numRowWide:  { flexWrap: 'nowrap', justifyContent: 'space-evenly' },
  numCard:       { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, minWidth: 120 },
  numCardBorder: { borderRightWidth: Platform.OS === 'web' ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)' },
  numValor: { fontSize: 30, fontWeight: '900', color: TEAL },
  numLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: '600' },

  // Benefits
  benefSection:    { backgroundColor: '#fff', paddingVertical: 56, paddingHorizontal: 20, alignItems: 'center' },
  sectionTitle:     { fontSize: 22, fontWeight: '900', color: '#0a2228', textAlign: 'center', marginBottom: 8 },
  sectionTitleWide: { fontSize: 30 },
  sectionSub: { fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 36 },
  benefGrid:     { flexDirection: 'column', gap: 14, width: '100%', maxWidth: 540 },
  benefGridWide: { flexDirection: 'row', flexWrap: 'wrap', maxWidth: 920, gap: 18, justifyContent: 'center' },
  benefCard:     { backgroundColor: BG, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: BORDER },
  benefCardWide: { width: 420, flex: undefined },
  benefIcon:   { fontSize: 30, marginBottom: 12 },
  benefTitulo: { fontSize: 16, fontWeight: '700', color: DARK, marginBottom: 6 },
  benefDesc:   { fontSize: 13, color: MUTED, lineHeight: 20 },

  // CTA
  ctaSection: { backgroundColor: HERO_BG, paddingVertical: 64, paddingHorizontal: 24, alignItems: 'center' },
  ctaTitle:     { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 32, maxWidth: 340, marginBottom: 10 },
  ctaTitleWide: { fontSize: 30, maxWidth: 560, lineHeight: 42 },
  ctaSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 28 },
  ctaBtn:  { backgroundColor: GOLD, borderRadius: 14, paddingHorizontal: 36, paddingVertical: 18 },
  ctaBtnT: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Footer
  footer:     { backgroundColor: '#071518', paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 6 },
  footerLogo: { fontSize: 20, fontWeight: '900' },
  footerSub:  { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  footerCopy: { fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8 },
})
