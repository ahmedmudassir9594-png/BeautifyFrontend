export function LoadingGrid() {
  return (
    <div className="loading-grid" data-testid="loading-products">
      {[1, 2, 3, 4].map((item) => (
        <div key={item}>
          <div className="skeleton image" />
          <div className="skeleton line" />
          <div className="skeleton line" />
        </div>
      ))}
    </div>
  );
}

export default LoadingGrid;
