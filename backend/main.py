from database import engine,SessionLocal,Base,getdata
from fastapi import FastAPI,Depends,HTTPException
from sqlalchemy.orm import Session
from model import Movies,Theater,Seats,ShowTime,User,Seatlock,Payment,Cancelticket
from schema import MovieSchema,MoviecreateSchema,Theaterschema,Theatercreateschema,SeatsSchema,SeatsCreateschema,ShowTimeCreateSchema,ShowTimeschema,SeatlockSchema,SeatlockCreateSchema,Token,Userschema,UserCreateschema,paymentschema,paymentcreateschema,cancelcreateticket
from typing import List
from auto_release import auto_release
import math
from fastapi.middleware.cors import CORSMiddleware
import qrcode
import uuid
from threading import Thread
from fastapi import BackgroundTasks
import random
from sqlalchemy.exc import IntegrityError
from jose import JWTError,jwt
from fastapi.security import OAuth2PasswordRequestForm,OAuth2PasswordBearer
from security import hash_function,verify_fucntion
from dotenv import load_dotenv
import os
import base64
from io import BytesIO
from fastapi.responses import StreamingResponse
from datetime import datetime,timedelta
load_dotenv()

SECRET_KEY=os.getenv("SECRET_KEY")
ALGORITM='HS256'
ACCESS_TIME_IN_MINUTES=1440
app=FastAPI()
origins=[
    "http://127.0.0.1:5500",
    "https://showza.netlify.app",
    "http://localhost:5500"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
Base.metadata.create_all(bind=engine)
@app.on_event("startup")
async def startup_event():
    t = Thread(target=auto_release)
    t.start()

o2Auth2schema=OAuth2PasswordBearer(tokenUrl="login")
def create_token(data:dict,expired_delta:timedelta):
     toencode=data.copy()
     expire=datetime.utcnow()+(expired_delta or timedelta(minutes=15))
     toencode.update({"exp":expire})
     encoded_jwt=jwt.encode(toencode,SECRET_KEY,algorithm=ALGORITM)
     return encoded_jwt

def current_user(token:str=Depends(o2Auth2schema),db:Session=Depends(getdata)):
    try:
         payload=jwt.decode(token,SECRET_KEY,algorithms=[ALGORITM])
         user_id=payload.get("sub")
         if not user_id:
             raise HTTPException(status_code=401,detail="INVALID CREDENTIALS")
    except JWTError:
        raise HTTPException(status_code=401,detail="INAVLID CREDNTIALS")
    user=db.query(User).filter(User.id==int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401,detail="INVALID CREDENTIAL")
    return user



@app.post('/register')
def register_user(U:UserCreateschema,db:Session=Depends(getdata)):
    p=db.query(User).filter(User.email==U.email).first()    
    if p:
        raise HTTPException(status_code=409,detail="USER ALREADY EXISTS")
    new_user=User(
         email=U.email,
        hashed_password=hash_function(U.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return{"message":"USER CREATED SUCESSFULLY"}
    
@app.post('/login')
def login_user(formdata:OAuth2PasswordRequestForm=Depends(),db:Session=Depends(getdata)):
    p=db.query(User).filter(User.email==formdata.username).first()
    if not p:
        raise HTTPException(status_code=401,detail="USER NOT FOUND")
    if not verify_fucntion(formdata.password,p.hashed_password):
        raise HTTPException(status_code=401 ,detail="USER NOT FOUND")
    access_time=timedelta(minutes=ACCESS_TIME_IN_MINUTES)
    access_token=create_token(
        data={"sub":str(p.id)},
        expired_delta=access_time
    )
    return {
        "access_token":access_token,
        "token_type":"bearer"
    }
    
    






#to fetch all movies
@app.get('/movies',response_model=List[MovieSchema])
def get_movies(db:Session=Depends(getdata)):
    return db.query(Movies).all()

@app.get('/movies/{movie_id}',response_model=MovieSchema)
def get_movies(movie_id:int,db:Session=Depends(getdata)):
    return db.query(Movies).filter(Movies.id==movie_id).first()

#to upload movies

@app.post('/movies',response_model=MovieSchema)
def add_movies(M:MoviecreateSchema,db:Session=Depends(getdata)):
   movie=Movies(movie_name=M.movie_name,description=M.description,rating=M.rating,watching_hours=M.watching_hours,language=M.language,released_on=M.released_on, genre=M.genre,movie_poster_url=M.movie_poster_url,Trailer_link=M.Trailer_link)
   db.add(movie)
   db.commit()
   db.refresh(movie)
   return movie



@app.get('/theaters/{User_location}',response_model=List[Theaterschema])
def get_theaters(User_location:str,db:Session=Depends(getdata)):
    return db.query(Theater).filter(Theater.Theater_location==User_location).all()

#to add theater
@app.post('/theaters',response_model=Theaterschema)
def add_theater(T:Theatercreateschema,db:Session=Depends(getdata)):
    theater=Theater(Theater_name=T.Theater_name,Theater_location=T.Theater_location, Theater_info=T.Theater_info)
    db.add(theater)
    db.commit()
    db.refresh(theater)
    return theater

@app.get('/showtimes',response_model=List[ShowTimeschema])
def show_times(db:Session=Depends(getdata)):
    return db.query(ShowTime).all()

@app.post('/showtimes',response_model=ShowTimeschema)
def create_showtime(ST:ShowTimeCreateSchema,db:Session=Depends(getdata)):
    new_time=ShowTime(Theater_id=ST.Theater_id, Movie_id=ST.Movie_id,total_seats=ST.total_seats,seats_per_row=ST.seats_per_row,Showtime=ST.Showtime,Vip_Seat_price=ST.Vip_Seat_price,Premium_Seat_price=ST.Premium_Seat_price,Standard_Seat_price=ST.Standard_Seat_price)
    db.add(new_time)
    db.commit()
    db.refresh(new_time)
    return new_time

@app.get('/seats',response_model=List[SeatsSchema])
def display_seats(db:Session=Depends(getdata)):
    return db.query(Seats).all()
     
@app.post('/seats')
def generate_seats(S:SeatsCreateschema,db:Session=Depends(getdata)):
    p=db.query(ShowTime).filter(ShowTime.id==S.Showtime_id).first()
    theater_Seats=[]
    if not p:
        raise HTTPException(status_code=404,detail="SHOW NOT FOUND")
    se=db.query(Seats).filter(Seats.Showtime_id==S.Showtime_id).first()
    if se:
        raise HTTPException(status_code=409,detail="SHOW ALREADY EXIST")
    if p.total_seats<0 or p.seats_per_row<0:
        raise HTTPException(status_code=400,detail="INVALID REQUIREMENT")
    if p.seats_per_row>p.total_seats:
        raise HTTPException(status_code=400,detail="INVALID REQUIREMENT")
    
    total_number_rows=(p.total_seats/p.seats_per_row)
    seat_list=[]
    
    code="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    total_number_rows=math.ceil(p.total_seats/p.seats_per_row)
    char=code[0]
    for i in range(total_number_rows):
                char=code[i]
                if len(seat_list)==p.total_seats:
                    break
                for j in range(0,p.seats_per_row):
                    VE=f"{char}{j+1}"
                    seat_list.append(VE)
    VIP_PERCENTAGE=int(p.total_seats*0.20)
    PREMIUM_PERCENTAGE=int(p.total_seats*0.30)
    STANDARD_PERCENTAGE=int(p.total_seats-(VIP_PERCENTAGE+PREMIUM_PERCENTAGE))
    SEATS_RECORD=[]
    for se in  range(len(seat_list)):
        if se<VIP_PERCENTAGE:
            vip_bit={
                "seat_number":seat_list[se],
                "seat_type": "VIP",
                "status":"Available",
                "Showtime_id": S.Showtime_id
                }
            SEATS_RECORD.append(vip_bit)
        elif VIP_PERCENTAGE <=se<VIP_PERCENTAGE+PREMIUM_PERCENTAGE:
            premium_bit={
                "seat_number":seat_list[se],
                "seat_type": "PREMIUM",
                "status":"Available",
                "Showtime_id": S.Showtime_id
                }
            SEATS_RECORD.append(premium_bit)
        else:
            standard_bit={
                "seat_number":seat_list[se],
                "seat_type": "STANDARD",
                "status":"Available",
                "Showtime_id": S.Showtime_id
                }
            SEATS_RECORD.append(standard_bit)
    print(SEATS_RECORD)
    for gen_seats in SEATS_RECORD:
        seat_data=Seats(seat_number=gen_seats['seat_number'],seat_type=gen_seats['seat_type'],status=gen_seats['status'],Showtime_id=gen_seats['Showtime_id'])
        db.add(seat_data)
    db.commit()
    return {"message":"Seats Created Sucessfully"}

@app.get("/seatlocks")
def get_seatlocks(db: Session = Depends(getdata), current: User = Depends(current_user)):
    return db.query(Seatlock).all()

@app.post('/seatlock/{seat_id}')
def lock_seat(seat_id:int,db:Session=Depends(getdata),current:User=Depends(current_user)):
    p=db.query(Seats).filter(Seats.id==seat_id).first()
    q=db.query(Seatlock).filter(Seatlock.seat_id==seat_id).first()
    if not p:
        raise HTTPException(status_code=404,detail="Requested Seat Not Found")
    if p.status=="sold":
            raise HTTPException(status_code=409,detail="Seat Already Sold ")
    elif not q or q==None:
        try:
            new_lock=Seatlock(seat_id=seat_id,locked_user=current.id, lock_time=datetime.utcnow())
            p.status="locked"
            db.add(new_lock)
            db.commit()
            db.refresh(new_lock)
            return {"message":"Seat Locked Sucessfully Please Complete The Payment For Confirmation Of Seat"}
        except IntegrityError as e:
            db.rollback()
            return{"message":{"Cannot Initiate The lock"}}
    else:
        if p.status=="locked":
            if datetime.utcnow()-q.lock_time>timedelta(minutes=5):
                p.status="Available"
                db.delete(q)
                db.commit()
            elif p.status=="locked" and datetime.utcnow()-q.lock_time<timedelta(minutes=5):
                if current.id==q.locked_user:
                    return {"message":"Continue The Payment to Confirm The Seat"}
                else:
                     raise HTTPException(status_code=409,detail="Seat Is Reserved By Someone else already")
            else:
                raise HTTPException(status_code=400,detail="Sorry For The Inconvenience This Seat Is Not Available at this time")
        else:
            p.status="locked"
            q.locked_user=current.id
            q.lock_time=datetime.utcnow()
        db.add(p)
        db.commit()
        db.refresh(p)

@app.post('/payment/{seat_id}')
def BookTicket(seat_id:int,P:paymentcreateschema,db:Session=Depends(getdata),current:User=Depends(current_user)):
    p=db.query(Seats).filter(Seats.id==seat_id).first()
    if not  p:
        raise HTTPException(status_code=404,detail="CANNOT FOUND SEAT")
    r=db.query(ShowTime).filter(ShowTime.id==p.Showtime_id).first()
    if not r:
        raise HTTPException(status_code=404,detail="No show time exists")
    q=db.query(Seatlock).filter(Seatlock.seat_id==seat_id).first()
    if not q:
        raise HTTPException(status_code=404,detail="CANNOT FOUND LOckedSEAT")
    X=db.query(Payment).filter(Payment.seatlock_id==q.id).first()
    if X:
        raise HTTPException(status_code=409,detail="Your seat confirmed and Pls avoid Repayment")
    if p.status=="sold":
        raise HTTPException(status_code=409,detail="Sorry Seat Already Sold")
    if p.status!="locked":
        raise HTTPException(status_code=400,detail="Sorry You need Slecet the Seat First")
    if q.locked_user!=current.id:
        raise HTTPException(status_code=403,detail="Sorry You are not allow for payment for this seat,Try to Book other seat")
    elif datetime.utcnow()-q.lock_time>timedelta(minutes=5):
        raise HTTPException(status_code=409,detail="Sorry You are not allow for payment for this seat at this momment,Try to Book other seat")
    else:
        if p.seat_type=="VIP":
            amount=r.Vip_Seat_price
        elif p.seat_type=="PREMIUM":
            amount=r.Premium_Seat_price
        else:
            amount=r.Standard_Seat_price
    user_payment=Payment(seatlock_id=q.id,userpay_id=current.id,fullname=P.fullname,cardnumber=f"{str(P.cardnumber)[-4:]}",amount=amount,Ticket_number=f"SHOWZA-{random.randint(1,10000)}")
    db.add(user_payment)
    user_payment.payment_status="Initiated"
    db.commit()
    db.refresh(user_payment)
    payement_info=db.query(Payment).filter(Payment.seatlock_id==user_payment.seatlock_id,Payment.userpay_id==user_payment.userpay_id,Payment.payment_status==user_payment.payment_status,Payment.amount==user_payment.amount).first()
    if not payement_info:
        return {"message":"Payment Failed!, If Money debiated From Your Account Will be credited Within two Bussiness days"}
    else:
        if p.status!="sold":
             p.status="sold"
        user_payment=db.query(Payment).filter(Payment.seatlock_id==payement_info.seatlock_id).first()
        user_payment.seatlock_id=payement_info.seatlock_id
        user_payment.userpay_id=current.id
        user_payment.fullname=P.fullname
        user_payment.cardnumber=int(f"{str(P.cardnumber)[-4:]}")
        user_payment.payment_status="Success"
        user_payment.amount=amount
        user_payment.Ticket_number = f"SHOWZA-{uuid.uuid4().hex[:8]}"

    db.commit()
    db.refresh(user_payment)
    return {
        "payment_status":"Success",
        "Ticket_number":user_payment.Ticket_number

    }

@app.get("/mybookings")
def mybookings(db:Session=Depends(getdata),current:User=Depends(current_user)):
    return db.query(Payment).filter(Payment.userpay_id==current.id).all()

@app.get('/ticket/{ticket_number}')
def ticketgenrator(ticket_number:str, db:Session=Depends(getdata),current:User=Depends(current_user)):
    p=db.query(Payment).filter(Payment.Ticket_number==ticket_number).first()
    if not p or p.userpay_id!=current.id:
        raise HTTPException(status_code=404,detail="Ticket Not Found ")
    h=db.query(Seatlock).filter(Seatlock.id==p.seatlock_id).first()
    d=db.query(Seats).filter(Seats.id==h.seat_id).first()
    a=db.query(ShowTime).filter(ShowTime.id==d.Showtime_id).first()
    if not h or not d or  not a :
        raise HTTPException(status_code=500,detail="Ticket Data is Missing")
    

    ticket_info=f"SHOWZA.COM\nFull-Name: {p.fullname}\nSeat-Type: {d.seat_type}\nSeat-Number: {d.seat_number}\nOwner-id:{p.userpay_id}\nTicket_number:{p.Ticket_number}\nPayment_Verified:{p.payment_status}\nDate of Booking:{p.created_at}\n~THANK YOU FOR BOOKING,HAVE A NICE DAY"    
    img=qrcode.make(ticket_info)
    buf=BytesIO()
    img.save(buf,format="PNG")
    buf.seek(0)
    return StreamingResponse(buf,media_type="image/png")

@app.post('/cancelbooking')
def cancel_booking(C:cancelcreateticket,db:Session=Depends(getdata),current:User=Depends(current_user)):
    p=db.query(Payment).filter(Payment.Ticket_number==C.Ticketnumber).first()
    if not p:
        raise HTTPException(status_code=404,detail="NOT A VALID TICKET NUMBER")
    m=db.query(Seatlock).filter(Seatlock.id==p.seatlock_id).first()
    if not m:
        raise HTTPException(status_code=404,detail="NOT A VALID TICKET NUMBER")
    if not  p.userpay_id==current.id:
         raise HTTPException(status_code=403,detail="NOT A VALID User")
    K=db.query(Seats).filter(Seats.id==m.seat_id).first()
    if not K:
        raise HTTPException(status_code=404,detail="NOT A VALID TICKET NUMBER")
    event=db.query(ShowTime).filter(ShowTime.id==K.Showtime_id).first()
    if datetime.utcnow()>=event.Showtime:
        raise HTTPException(status_code=409,detail="CANNOT ABLE INITIATE THE CANCELLATION AT NOW")
    if p.payment_status=="cancelled":
        raise HTTPException(status_code=409,detail="Seat cancelled Already")
    K.status="Available"
    p.payment_status="cancelled"
    p.cardnumber=00000000000
    db.add(p)
    db.commit()
    db.refresh(p)
    return{
        "message":f"Your cancellation request has been successfully processed. A refund for Ticket Number: {C.Ticketnumber} has been initiated and will be credited to your account within 2 business days. Thank you for choosing SHOWZA"}
