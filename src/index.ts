import "reflect-metadata"
import { AppDataSource } from "./data-source.ts"
import createServer from "./app.ts"


AppDataSource.initialize().then(async () => {
    const server = await createServer();

    server.listen(3000, () => {
        console.log("Server is running on port 3000");
    });

}).catch(error => console.log(error))
