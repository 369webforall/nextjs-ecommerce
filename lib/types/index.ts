import { cartItemSchema } from "../validation/validator";
import { z } from "zod";

//CART

export type CartItem = z.infer<typeof cartItemSchema>;
