import { types } from "mobx-state-tree";

export const State = types.optional(
    types.union(
        types.literal("intial"),
        types.literal("loading"),
        types.literal("success"),
        types.literal("error")
    ),
    "intial"
);
