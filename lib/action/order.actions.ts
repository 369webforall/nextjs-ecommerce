"use server";
import { auth } from "@/auth";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.action";
import { redirect } from "next/navigation";
import { insertOrderSchema } from "../validation/validator";
import prisma from "@/prisma/client";
import { formatError } from "../utils";

export const createOrder = async () => {
  try {
    const session = await auth();
    if (!session) throw new Error("User is not authenticated");

    const cart = await getMyCart();
    if (!cart || cart.items.length === 0) redirect("/cart");

    const user = await getUserById(session?.user?.id!);
    if (!user?.address || user.address.length === 0)
      redirect("/shipping-address");
    if (!user.paymentMethod) redirect("/payment-method");

    const address = user.address[0]; // Assuming you're using the first address

    // Validate and handle lat, lng, and shippingPrice
    const validatedAddress = {
      ...address,
      lat: address.lat !== null ? address.lat : 0,
      lng: address.lng !== null ? address.lng : 0,
    };

    const shippingPrice = cart.shippingPrice <= 100 ? 2 : 10;

    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: validatedAddress,
      paymentMethod: user.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
    });

    const insertedOrderId = await prisma.$transaction(async (tx) => {
      const insertedOrder = await tx.order.create({
        data: order,
      });

      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            ...item,
            price: parseFloat(item.price.toFixed(2)), // Ensure price is a number
            orderId: insertedOrder.id,
          },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          totalPrice: 0,
          shippingPrice: 0,
          taxPrice: 0,
          itemsPrice: 0,
        },
      });

      return insertedOrder.id;
    });

    if (!insertedOrderId) throw new Error("Order not created");
    redirect(`/order/${insertedOrderId}`);
  } catch (error) {
    if (error instanceof Error && error.name === "NextRedirectError") {
      throw error;
    }
    return { success: false, message: formatError(error) };
  }
};
