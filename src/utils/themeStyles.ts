import { StoreSettings } from '../types';

export const getThemeTypography = (settings?: Partial<StoreSettings>) => {
  const typo = settings?.typography || {
    fontFamily: 'Space Grotesk',
    titleWeight: 'black',
    enableColorFlow: true,
    colorMode: 'rainbow_flow',
    enableTextGlow: true,
    enableChunkyTitles: true,
    applyToNavAndButtons: true,
    applyToSectionHeadings: true,
  };

  const isFlowEnabled = typo.enableColorFlow !== false && typo.colorMode !== 'pure_white';

  let colorClass = 'thanox-flow-rainbow';
  if (!isFlowEnabled || typo.colorMode === 'pure_white') {
    colorClass = 'thanox-flow-white';
  } else if (typo.colorMode === 'cyber_cyan') {
    colorClass = 'thanox-flow-cyan';
  } else if (typo.colorMode === 'neon_purple') {
    colorClass = 'thanox-flow-purple';
  } else if (typo.colorMode === 'flame_fire') {
    colorClass = 'thanox-flow-flame';
  }

  const weightClass =
    typo.titleWeight === 'normal'
      ? 'font-normal'
      : typo.titleWeight === 'medium'
      ? 'font-medium'
      : typo.titleWeight === 'semibold'
      ? 'font-semibold'
      : typo.titleWeight === 'bold'
      ? 'font-bold'
      : typo.titleWeight === 'extrabold'
      ? 'font-extrabold'
      : 'font-black';

  let sizeScaleClass = '';
  if (typo.fontSizeScale === 'small') sizeScaleClass = 'text-[0.9em]';
  else if (typo.fontSizeScale === 'large') sizeScaleClass = 'text-[1.1em]';
  else if (typo.fontSizeScale === 'xlarge') sizeScaleClass = 'text-[1.25em]';
  else if (typo.fontSizeScale === 'xxlarge') sizeScaleClass = 'text-[1.4em]';

  const glowClass = typo.enableTextGlow !== false && isFlowEnabled ? 'thanox-glow' : '';

  const fontStyle = {
    fontFamily: `'${typo.fontFamily || 'Space Grotesk'}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
  };

  return {
    isFlowEnabled,
    colorClass,
    weightClass,
    sizeScaleClass,
    glowClass,
    fontStyle,
    fontFamily: typo.fontFamily || 'Space Grotesk',
    // Combined ready-to-use classes
    logoClass: `thanox-title-font ${weightClass} ${sizeScaleClass} ${colorClass} ${glowClass}`,
    headingClass: `thanox-title-font ${weightClass} ${sizeScaleClass} ${typo.applyToSectionHeadings !== false ? colorClass : 'text-white'} ${glowClass}`,
    navClass: `thanox-title-font ${weightClass} ${sizeScaleClass} ${typo.applyToNavAndButtons !== false ? colorClass : 'text-white'} ${glowClass}`,
  };
};
