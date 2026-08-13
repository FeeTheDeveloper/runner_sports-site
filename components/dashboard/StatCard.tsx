interface StatCardProps {
  label: string;
  value: string | number;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div>
      <p>{label}</p>
      <p>{value}</p>
    </div>
  );
}
