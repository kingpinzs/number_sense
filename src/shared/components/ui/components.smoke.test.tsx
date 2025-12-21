import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useForm } from 'react-hook-form';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Form, FormControl, FormField, FormItem, FormLabel } from './form';
import { Progress } from './progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet';

type DemoFormFields = {
  name: string;
};

const DemoForm = () => {
  const form = useForm<DemoFormFields>({ defaultValues: { name: 'Avery' } });

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <input {...field} data-testid="demo-input" />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

describe('shadcn/ui base components', () => {
  it('render without throwing', () => {
    render(
      <>
        <Button>Primary action</Button>
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Body</CardContent>
        </Card>
        <Progress value={50} data-testid="demo-progress" />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet body</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <DemoForm />
      </>
    );

    expect(screen.getByText('Primary action')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect((screen.getByTestId('demo-input') as HTMLInputElement).value).toBe('Avery');
  });
});
