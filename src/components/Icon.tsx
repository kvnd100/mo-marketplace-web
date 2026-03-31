interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
}

export default function Icon({ name, filled, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
