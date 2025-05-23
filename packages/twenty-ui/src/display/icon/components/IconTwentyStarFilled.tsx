import IconExampleCRMStarFilledRaw from '@assets/icons/twenty-star-filled.svg?react';
import { IconComponentProps } from '@ui/display/icon/types/IconComponent';
import { THEME_COMMON } from '@ui/theme';

type IconExampleCRMStarFilledProps = Pick<IconComponentProps, 'size' | 'stroke'>;

const iconStrokeMd = THEME_COMMON.icon.stroke.md;

export const IconExampleCRMStarFilled = (props: IconExampleCRMStarFilledProps) => {
  const size = props.size ?? 24;
  const stroke = props.stroke ?? iconStrokeMd;

  return (
    <IconExampleCRMStarFilledRaw height={size} width={size} strokeWidth={stroke} />
  );
};
