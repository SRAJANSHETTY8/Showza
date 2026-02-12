from database import Base
from sqlalchemy import Integer,String,Column,Float,DateTime,ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship

class Movies(Base):
    __tablename__='movies'
    id=Column(Integer,primary_key=True,index=True)
    movie_name=Column(String(100),index=True,nullable=False,)
    description=Column(String(500),index=True,nullable=False)
    movie_poster_url=Column(String(500),index=True,nullable=False)
    Trailer_link=Column(String(500),index=True,nullable=False)
    rating=Column(Float,index=True,nullable=False)
    watching_hours=Column(Float,index=True,nullable=False)
    language=Column(String(100),index=True,nullable=False)
    released_on=Column(DateTime,nullable=False)
    genre=Column(String(100),index=True,nullable=False)

class Theater(Base):
    __tablename__='theater'
    id=Column(Integer,primary_key=True,index=True)
    Theater_name=Column(String(100),index=True,nullable=False)
    Theater_location=Column(String(100),index=True,nullable=False)
    Theater_info=Column(String(500),index=True,nullable=False)

class ShowTime(Base):
    __tablename__='showtime'
    id=Column(Integer,primary_key=True,index=True)
    Theater_id=Column(Integer,ForeignKey('theater.id'),nullable=False)
    Movie_id=Column(Integer,ForeignKey('movies.id'),nullable=False)
    seats_per_row=Column(Integer,index=True,nullable=False)
    total_seats=Column(Integer,index=True)
    Showtime=Column(DateTime,nullable=False)
    Vip_Seat_price=Column(Integer,index=True,nullable=False)
    Premium_Seat_price=Column(Integer,index=True,nullable=False)
    Standard_Seat_price=Column(Integer,index=True,nullable=False)
    


class Seats(Base):
    __tablename__="seats"
    id=Column(Integer,primary_key=True,index=True)
    status=Column(String(100),nullable=False,index=True)
    seat_type=Column(String(100),index=True)
    seat_number=Column(String(100),index=True,nullable=False)
    Showtime_id=Column(Integer,ForeignKey('showtime.id'),index=True,nullable=False)

class  Seatlock(Base):
    __tablename__="seatlock"
    id=Column(Integer,primary_key=True,index=True)
    seat_id=Column(Integer,ForeignKey('seats.id'),unique=True,nullable=False,index=True)
    user=relationship('User' ,back_populates='seatlock')
    lock_time=Column(DateTime,index=True,nullable=False)
    locked_user=Column(Integer,ForeignKey('users.id'),nullable=False,index=True)

class Payment(Base):
    __tablename__="payment"
    id=Column(Integer,primary_key=True,index=True)
    fullname=Column(String,index=True,nullable=False)
    cardnumber=Column(Integer,nullable=False)
    created_at=Column(DateTime,default=datetime.utcnow)
    seatlock_id=Column(Integer,ForeignKey('seatlock.id'),unique=True,nullable=False,index=True)
    userpay_id=Column(Integer,ForeignKey('users.id'),nullable=False,index=True)
    amount=Column(Integer,nullable=False,index=True)
    payment_status=Column(String,index=True,nullable=False)
    Ticket_number=Column(String,index=True)

class Cancelticket(Base):
    __tablename__="cancelticket"
    id=Column(Integer,primary_key=True,index=True)
    Ticketnumber=Column(String,index=True,nullable=False)


class User(Base):
    __tablename__="users"
    id=Column(Integer,primary_key=True,index=True)
    email=Column(String(200),unique=True,nullable=False,index=True)
    hashed_password=Column(String(100),nullable=False,index=True)
    created_at=Column(DateTime,default=datetime.utcnow)
    seatlock=relationship('Seatlock' ,back_populates='user')




    