import accountSchemas from "./account/schemas.js";
import orderSchemas from "./order/schemas.js";
import positionSchemas from "./position/schemas.js";
import userSchemas from "./user/schemas.js";

export default {
    ...accountSchemas,
    ...orderSchemas,
    ...positionSchemas,
    ...userSchemas,
};