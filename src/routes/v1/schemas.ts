import accountSchemas from "./account/schemas.js";
import orderSchemas from "./order/schemas.js";
import positionSchemas from "./position/schemas.js";

export default {
    ...accountSchemas,
    ...orderSchemas,
    ...positionSchemas,
};