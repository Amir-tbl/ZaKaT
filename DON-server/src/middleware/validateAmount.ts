import {Request, Response, NextFunction} from 'express';

export function validateAmount(req: Request, res: Response, next: NextFunction): void {
  const {amountCents} = req.body;

  if (amountCents === undefined || amountCents === null) {
    res.status(400).json({error: 'amountCents is required'});
    return;
  }

  if (!Number.isInteger(amountCents)) {
    res.status(400).json({error: 'amountCents must be an integer'});
    return;
  }

  if (amountCents < 100) {
    res.status(400).json({error: 'amountCents must be at least 100 (1 EUR)'});
    return;
  }

  if (amountCents > 999900) {
    res.status(400).json({error: 'amountCents must be at most 999900 (9999 EUR)'});
    return;
  }

  next();
}
