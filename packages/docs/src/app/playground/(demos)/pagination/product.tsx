import type { Product } from './api'

type ProductViewProps = React.ComponentProps<'div'> & {
  product: Product
}

export function ProductView({ product, ...props }: ProductViewProps) {
  return (
    <div {...props}>
      <div className="flex items-baseline gap-2">
        <h3 className="my-1"> {product.name}</h3>
        <span className="ml-auto">{product.price}</span>
        <span className="text-xs text-zinc-500">SKU-{product.id + 1}</span>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">
        {product.description}
      </p>
    </div>
  )
}
