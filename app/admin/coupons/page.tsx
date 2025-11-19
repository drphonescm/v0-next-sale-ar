export default function AdminCouponsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Gestión de Cupones</h2>
      <p className="text-muted-foreground">Aquí podrás crear y administrar los cupones de descuento.</p>
      
      {/* Added empty state message */}
      <div className="flex flex-col items-center justify-center h-[200px] border rounded-md bg-muted/10">
        <p className="text-muted-foreground">No hay datos de cupones disponibles en este momento.</p>
      </div>
    </div>
  )
}
