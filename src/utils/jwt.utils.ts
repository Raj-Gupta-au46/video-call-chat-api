import jwt from "jsonwebtoken";

class JWTToken {
  public async getAccessToken(payload: {}): Promise<string> {
    const token = jwt.sign(payload, `${process.env.JWT_ACCESS_SECRET}`);
    return token;
  }

  public async verifyAccessToken(token: string): Promise<any> {
    return jwt.verify(token, `${process.env.JWT_ACCESS_SECRET}`);
  }
}

export default JWTToken;
