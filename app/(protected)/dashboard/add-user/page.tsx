import AddUserForm from "./_components/add-user-form"

export default function AddUserPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8 lg:py-8 max-w-xl">
      <header>
        <p className="text-xs uppercase tracking-widest mb-0.5 text-slate-400 font-semibold">
          Staff
        </p>
        <h1 className="text-2xl font-bold text-slate-100">
          Registrar miembro
        </h1>
        <p className="text-sm mt-1 text-slate-400">
          Las credenciales se generan automáticamente para compartir.
        </p>
      </header>

      {/* Formulario client — maneja estado de generación de credenciales */}
      <AddUserForm />
    </div>
  )
}