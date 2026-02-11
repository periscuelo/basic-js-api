import util from "node:util";

export const inspect = (id, data) => {
  console.log(id, util.inspect(data, { depth: null, colors: true }));
}
