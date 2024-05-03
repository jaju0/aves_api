import accountSchemas from "./account/schemas.js";
import orderSchemas from "./order/schemas.js";

export default {
    ...accountSchemas,
    ...orderSchemas
};