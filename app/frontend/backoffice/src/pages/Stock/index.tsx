const StockPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Gestion du Stock</h1>
          <p className="text-foreground-muted mt-1">Gérez vos ingrédients et niveaux de stock.</p>
        </div>
      </div>

      <div className="bg-surface-light rounded-2xl border border-white/5 p-8 text-center">
        <p className="text-foreground-muted">Le module de gestion de stock est en cours de développement.</p>
      </div>
    </div>
  );
};

export default StockPage;
