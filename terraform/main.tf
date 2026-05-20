# ==== Terraform (Infraestructura como Código - IaC) ====
# Enfoque Declarativo: Documentamos exactamente la 'foto' de los servidores que necesitamos.

# 1. Definición del Proveedor Cloud (AWS)
provider "aws" {
  region = "us-east-1" # Desplegaremos nuestra aplicación en Virginia
}

# 2. Aprovisionamiento del Cluster de Kubernetes (EKS)
resource "aws_eks_cluster" "app_cluster" {
  name     = "ia-courses-cluster"
  role_arn = aws_iam_role.eks_role.arn

  # Segmentación y redes lógicas de AWS (donde residirán las máquinas físicas)
  vpc_config {
    subnet_ids = ["subnet-a1b2c3d4", "subnet-e5f6g7h8"]
  }
}

# 3. Políticas de Seguridad Base (Principio de menor privilegio)
resource "aws_iam_role" "eks_role" {
  name = "eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })
}
