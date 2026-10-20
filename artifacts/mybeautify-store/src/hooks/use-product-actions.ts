import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetCartQueryKey,
  getGetWishlistQueryKey,
  useAddCartItem,
  useAddWishlistItem,
  useGetWishlist,
  useRemoveWishlistItem,
  type Product,
} from '@workspace/api-client-react';
import { toArray } from '@/utils/array';

export function useProductActions() {
  const qc = useQueryClient();
  const addCart = useAddCartItem();
  const addWish = useAddWishlistItem();
  const removeWish = useRemoveWishlistItem();
  const wishlist = useGetWishlist();

  const savedIds = useMemo(
    () => new Set(toArray<{ id: string | number }>(wishlist.data).map((item) => item.id)),
    [wishlist.data]
  );

  const save = (product: Product) => {
    if (savedIds.has(product.id)) {
      removeWish.mutate(
        { productId: product.id },
        { onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) }
      );
    } else {
      addWish.mutate(
        { data: { productId: product.id } },
        { onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) }
      );
    }
  };

  const add = (product: Product) =>
    addCart.mutate(
      { data: { productId: product.id, quantity: 1 } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetCartQueryKey() }) }
    );

  return { savedIds, save, add };
}

export default useProductActions;
