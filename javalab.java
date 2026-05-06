public class javalab {
    
    public static void main(String[] args) {
        Stundent s1 = new Stundent("Abdi", 24, 19);
        s1.display();
        s1.study();
        teacher t1 = new teacher("vdcjhvdj",23, "herejj",101);
        t1.display();
        C c1 = new C();
    

        
    }
}
class person{
        protected String name ;
        protected int age;
        protected double income = 10000;
        public person(){

            this.name="Abdi";
            this.age= 24;

        }
    public person (String name , int age){
        this.name=name ;
        this.age = age;
        
    }
      void display()    {
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);

      }
    }

    class Stundent extends person{
        int id;
        double income = 5000;
       
        public Stundent (String name , int age , int id){
            super(name,age);
            this.id=id;
        }
        void study(){
            System.out.println("Student is studying");
        }
        void display(){
            super.display();
            System.out.println("ID: " + id);
            System.out.println("Income: " + income);
        }
class teacher extends person{
            String address ;
            int id;
            double income = 2000;
    public teacher (String name,int age ,String address,int id){
        super(name,age);
        this.address=address;
        this.id=id;
    }
        void display(){
                super.display();
                System.out.println("ID : "+id);
                System.out.println("Address : "+address);



            }
        }
}


  
// TIP
// when we create an object of a subclass ........implicitly and explicitly....Upcasting(type convertion) and doawncasting
// UPCASTing = converting the refernece type of object class ....person p1 = new student("yonas",23,112);...(varibels are decided by REFERENCE and methods are decided by the OBJECT)
// downcasting = 
// access modifier
//polimorfisim
// overloading(by changig the length parameter list with the same method name(changing only return type wont overload))  and overiding ()



class A{
    public A (){
        System.out.println("A");
    }
}
class B extends A{
    public B (){
        super();
        System.out.println("B");
    }
}
class C extends B{
    public C (){
        super();
        System.out.println("C");
    }
}











  