import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Brain, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate registration - will be replaced with real auth
    setTimeout(() => {
      setIsLoading(false);
      navigate("/mode-select");
      toast({
        title: "Conta criada!",
        description: "Bem-vindo ao MindFlow.",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center p-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/login")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex flex-col items-center pb-8 px-8">
        <div className="w-16 h-16 rounded-2xl gradient-calm flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Criar Conta</h1>
        <p className="text-muted-foreground mt-1">Comece a organizar sua vida</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Name */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 pl-12 bg-card border-border rounded-xl"
              required
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 pl-12 bg-card border-border rounded-xl"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Crie uma senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 pl-12 pr-12 bg-card border-border rounded-xl"
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Mínimo de 6 caracteres
          </p>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-14 text-lg font-medium gradient-calm text-white border-0 rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          Ao criar uma conta, você concorda com nossos{" "}
          <a href="#" className="text-primary">Termos de Uso</a> e{" "}
          <a href="#" className="text-primary">Política de Privacidade</a>.
        </p>

        {/* Login Link */}
        <p className="text-center text-muted-foreground mt-8">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-primary font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
