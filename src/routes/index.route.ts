import { Router } from "express";

class Common {
  public router: Router;

  constructor() {
    this.router = Router();
    this.home();
  }

  // create user
  private home(): void {
    this.router.get("/", (req, res) => {
      res.send("Hello from the server🌏");
    });
  }
}

export default Common;
