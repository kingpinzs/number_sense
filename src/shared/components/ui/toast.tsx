import { Toaster as SonnerToaster, toast as sonnerToast, type ExternalToast, type ToasterProps } from 'sonner';

type ToastOptions = ExternalToast;

export const toast = (message: string, options?: ToastOptions) => sonnerToast(message, options);

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right"
      expand
      richColors
      toastOptions={{
        className: 'bg-background text-foreground border border-border shadow-lg',
        ...props.toastOptions
      }}
      {...props}
    />
  );
}
