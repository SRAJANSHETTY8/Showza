from passlib.context import CryptContext
pwd_context=CryptContext(schemes=['bcrypt'],deprecated=['auto'])
def hash_function(password:str):
    hashed_password=pwd_context.hash(password)
    return hashed_password
def verify_fucntion(first_password:str,hashed_password:str):
    return pwd_context.verify(first_password,hashed_password)
    
