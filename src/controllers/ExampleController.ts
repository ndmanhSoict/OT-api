import { Request, Response } from 'express';

export class ExampleController {
  static async getExample(req: Request, res: Response): Promise<void> {
    try {
      res.json({ message: 'Example controller response' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createExample(req: Request, res: Response): Promise<void> {
    try {
      const { data } = req.body;
      res.json({ message: 'Example created', data });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
