
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 py-6 flex justify-between items-center border-b">
        <h1 className="text-2xl font-medium">MessageSync</h1>
        <div className="space-x-4">
          <Button variant="outline" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="bg-slate-100 text-slate-800 text-sm px-3 py-1 rounded-full">Seamless Communication</span>
          <h2 className="text-4xl md:text-5xl font-medium mt-6 mb-4">Connect with others in real-time</h2>
          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            A simple, elegant messaging platform for students, teachers, and institutions to communicate effectively.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Button 
              size="lg" 
              asChild 
              className="px-8"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Link to="/register">
                Get Started
                <motion.span
                  initial={{ x: 0 }}
                  animate={{ x: isHovered ? 5 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-2"
                >
                  →
                </motion.span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full max-w-5xl">
          {[
            {
              title: "Real-time Messaging",
              description: "Send and receive messages instantly with online status indicators."
            },
            {
              title: "Role-based Access",
              description: "Different permissions for students, teachers, and institutions."
            },
            {
              title: "Simple Interface",
              description: "Clean, intuitive design focused on communication."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="p-6 rounded-lg border bg-white"
            >
              <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </main>
      
      <footer className="py-8 px-8 text-center text-slate-500 border-t mt-20">
        <p>© 2023 MessageSync. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
