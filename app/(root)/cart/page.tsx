import { getMyCart } from "@/lib/action/cart.actions";
import CartForm from "./cart-form";
import { Cart } from "@prisma/client";
import { CartItem } from "@/lib/types";
import { APP_NAME } from "@/lib/constant";

export const metadata = {
  title: `Shopping Cart - ${APP_NAME}`,
};

const CartPage = async () => {
  const cart = await getMyCart();

  const parsedCart: Cart = {
    ...cart,
    items: cart?.items as CartItem[],
  };

  return <CartForm cart={parsedCart} />;
};

export default CartPage;
