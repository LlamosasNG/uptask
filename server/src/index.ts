import server from "./server";
import colors from "colors";
import { connectDB } from './config/db'

const port = process.env.PORT || 8000;

void connectDB().then(() => server.listen(port, () => {
  console.log(colors.cyan.bold(`Server is running on port ${port}`));
}));
