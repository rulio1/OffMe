interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">{title}</h1>
      </header>
      <div className="flex flex-col items-center px-4 py-16 text-center">
        {icon && <div className="mb-4 text-offme-muted">{icon}</div>}
        <p className="text-lg font-medium text-offme-text">Em breve</p>
        <p className="mt-2 max-w-sm text-sm text-offme-muted">{description}</p>
      </div>
    </div>
  );
}