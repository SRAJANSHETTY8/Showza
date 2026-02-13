from model import Movies,Theater,ShowTime,Seats,Seatlock,Payment,User,Cancelticket
from pydantic import BaseModel
from database import Base
from datetime import datetime

class MovieSchema(BaseModel):
    id:int
    movie_name:str
    description:str
    rating:float
    watching_hours:float
    language:str
    movie_poster_url:str
    released_on:datetime
    genre:str
    Trailer_link:str
    class Config:
        orm_mode=True



class MoviecreateSchema(BaseModel):
    movie_name:str
    description:str
    rating:float
    Trailer_link:str
    movie_poster_url:str
    watching_hours:float
    language:str
    released_on:datetime
    genre:str

class Theaterschema(BaseModel):
    id:int
    Theater_name:str
    Theater_location:str
    Theater_info:str
    class Config:
        orm_mode=True




class Theatercreateschema(BaseModel):
    Theater_name:str
    Theater_location:str
    Theater_info:str

class ShowTimeschema(BaseModel):
    id:int
    Theater_id:int
    Movie_id:int
    Showtime:datetime
    Vip_Seat_price:int
    Premium_Seat_price:int
    Standard_Seat_price:int
    class Config:
        orm_mode=True


class ShowTimeCreateSchema(BaseModel):
    Theater_id:int
    Movie_id:int
    total_seats:int
    seats_per_row:int
    Showtime:datetime
    Vip_Seat_price:int
    Premium_Seat_price:int
    Standard_Seat_price:int

class SeatsSchema(BaseModel):
    id:int
    seat_number:str
    seat_type:str
    status:str
    Showtime_id:int
    class Config:
        orm_mode=True



class SeatsCreateschema(BaseModel):
    Showtime_id:int

class cancelcreateticket(BaseModel):
    Ticketnumber:str
    class Config:
        orm_mode=True

class paymentschema(BaseModel):
    id:int
    fullname:str
    Ticket_number:str
    created_at:datetime
    amount:int
    payment_status:str
    class Config:
        orm_mode=True
class paymentcreateschema(BaseModel):
    fullname:str
    cardnumber:int
    
    

class Userschema(BaseModel):
    id:int
    email:str
    created_at:datetime
    class Config:
        orm_mode=True

class UserCreateschema(BaseModel):
    email:str
    password:str
class SeatlockSchema(BaseModel):
    id:int
    seat_id:int
    class Config:
        orm_mode=True
class SeatlockCreateSchema(BaseModel):
    seat_id:int
    lock_time:datetime
    locked_user:int

class Token():
    access_token:str
    token_type:str


