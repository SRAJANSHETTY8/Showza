import time
from database import engine,SessionLocal,Base,getdata
from datetime import datetime,timedelta
from model import Seatlock,Seats,Payment
def auto_release():
        while True:
            time.sleep(60)
            db=SessionLocal()
            
            try:
                expirytime=datetime.utcnow()-timedelta(minutes=5)
                locks=db.query(Seatlock).filter(Seatlock.lock_time<expirytime).all()
            
                for locked_seats in locks:
                    p=db.query(Seats).filter(Seats.id==locked_seats.seat_id).first()
                    g=db.query(Payment).filter(Payment.seatlock_id==locked_seats.id).first()
                    if g:
                     continue
                    else:
                        if not p:
                            continue
                        p.status="Available"
                        db.delete(locked_seats)
                db.commit()
            
            finally:
                db.close()
