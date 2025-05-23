import { useTheme } from '@emotion/react';

import IconExampleCRMStarRaw from '@assets/icons/twenty-star.svg?react';
import { IconComponentProps } from '@ui/display/icon/types/IconComponent';

type IconExampleCRMStarProps = Pick<IconComponentProps, 'size' | 'stroke'>;

export const IconExampleCRMStar = (props: IconExampleCRMStarProps) => {
  const theme = useTheme();
  const size = props.size ?? 24;
  const stroke = props.stroke ?? theme.icon.stroke.md;

  return <IconExampleCRMStarRaw height={size} width={size} strokeWidth={stroke} />;
};
