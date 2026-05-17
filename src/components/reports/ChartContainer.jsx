import { Card, CardBody, CardHeader } from '../ui/Card';

export function ChartContainer({ title, subtitle, action, children, height = 'h-80' }) {
  return (
    <Card hover={false} className="h-full">
      <CardHeader title={title} subtitle={subtitle} action={action} />
      <CardBody className={height}>{children}</CardBody>
    </Card>
  );
}
