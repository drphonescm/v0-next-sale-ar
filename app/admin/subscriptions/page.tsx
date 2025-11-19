export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Suscripciones</h2>
      <p className="text-muted-foreground">Control de planes y pagos de suscripción.</p>
      
      {/* Added empty state message */}
      <div className="flex flex-col items-center justify-center h-[200px] border rounded-md bg-muted/10">
        <p className="text-muted-foreground">No hay datos de suscripciones disponibles en este momento.</p>
      </div>
    </div>
  )
}
