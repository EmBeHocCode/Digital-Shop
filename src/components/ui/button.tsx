import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-soft hover:-translate-y-0.5 hover:bg-[#ff6b9a]",
        secondary:
          "bg-secondary text-white shadow-soft hover:-translate-y-0.5 hover:bg-[#5c7dff]",
        outline:
          "border border-rose-200 bg-white text-ink hover:border-primary hover:text-primary",
        ghost: "bg-transparent text-ink hover:bg-white/70"
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
);

interface SharedProps extends VariantProps<typeof buttonVariants> {
  children: ReactNode;
  className?: string;
}

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  href?: never;
};

type LinkButtonProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  href: string;
};

export function Button(props: ButtonProps | LinkButtonProps) {
  const classes = cn(buttonVariants({ variant: props.variant }), props.className);

  if ("href" in props && props.href) {
    const { href, children, className, variant, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { children, className, variant, ...rest } = props as ButtonProps;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
