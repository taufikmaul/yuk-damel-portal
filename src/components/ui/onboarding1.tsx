import React from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Onboarding1ButtonConfig {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface Onboarding1Props {
  badge?: string;
  heading?: string;
  description?: string;
  image?: {
    src: string;
    alt: string;
  };
  currentStep?: number;
  totalSteps?: number;
  buttons?: Onboarding1ButtonConfig[];
  labels?: {
    stepOf?: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export function Onboarding1({
  badge = 'Onboarding',
  heading = "Let's get you started",
  description,
  image,
  currentStep = 1,
  totalSteps = 3,
  buttons = [],
  labels = {},
  className,
  children,
}: Onboarding1Props) {
  const stepTemplate = labels.stepOf || 'Langkah {current} dari {total}';
  const stepText = stepTemplate
    .replace('{current}', String(currentStep))
    .replace('{total}', String(totalSteps));

  return (
    <section className={cn('py-8 sm:py-12 w-full', className)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          {/* Step indicator */}
          {totalSteps > 0 && (
            <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbf2f0] border border-[#f0dbd8] text-xs font-semibold text-[#8f3b3f]">
              <span className="size-1.5 rounded-full bg-[#a9484c] animate-pulse" />
              <span>{stepText}</span>
            </div>
          )}

          {/* Badge */}
          {badge && (
            <Badge
              variant="outline"
              className="mb-4 bg-white/80 border-[#f0dbd8] text-slate-800 text-xs px-3.5 py-1 font-semibold shadow-xs"
            >
              <Sparkles className="mr-1.5 size-3.5 text-[#a9484c]" />
              {badge}
            </Badge>
          )}

          {/* Heading */}
          {heading && (
            <h1 className="mb-3 text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {heading}
            </h1>
          )}

          {/* Description */}
          {description && (
            <p className="mb-6 max-w-2xl text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
              {description}
            </p>
          )}

          {/* Image */}
          {image && (
            <div className="relative mb-8 aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-[#f0dbd8] shadow-md">
              <img
                className="absolute inset-0 size-full object-cover"
                src={image.src}
                alt={image.alt}
              />
            </div>
          )}

          {/* Dual CTAs / Action Buttons */}
          {buttons.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {buttons.map((btn, idx) => {
                if (btn.href) {
                  return (
                    <Button
                      key={idx}
                      variant={btn.variant ?? 'default'}
                      disabled={btn.disabled}
                      asChild
                      className="cursor-pointer font-semibold shadow-xs"
                    >
                      <a href={btn.href} target="_blank" rel="noreferrer">
                        {btn.label}
                        {btn.icon}
                      </a>
                    </Button>
                  );
                }
                return (
                  <Button
                    key={idx}
                    variant={btn.variant ?? 'default'}
                    onClick={btn.onClick}
                    disabled={btn.disabled}
                    className="cursor-pointer font-semibold shadow-xs"
                  >
                    {btn.label}
                    {btn.icon}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Slot for Main Interactive Content / Card Form */}
          {children && <div className="w-full text-left mt-2">{children}</div>}
        </div>
      </div>
    </section>
  );
}
