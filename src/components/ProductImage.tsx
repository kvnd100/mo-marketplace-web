import { useState } from 'react';
import Icon from './Icon';

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
  iconSize?: string;
}

export default function ProductImage({
  src,
  alt,
  className = 'h-full w-full object-contain p-2',
  iconSize = 'text-4xl',
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icon name="image" className={`${iconSize} text-zinc-300`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
