variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "ia-courses"
}

variable "environment" {
  description = "Entorno de despliegue"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "Region de AWS"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block para la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Zonas de disponibilidad"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "private_subnets" {
  description = "Subnets privadas"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnets" {
  description = "Subnets publicas"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "db_instance_class" {
  description = "Clase de instancia RDS"
  type        = string
  default     = "db.t3.medium"
}

variable "db_name" {
  description = "Nombre de la base de datos"
  type        = string
  default     = "ia_courses_db"
}

variable "db_username" {
  description = "Usuario de la base de datos"
  type        = string
  default     = "administrador"
}

variable "db_password" {
  description = "Contrasena de la base de datos (proveer en terraform.tfvars)"
  type        = string
  sensitive   = true
}

variable "node_instance_types" {
  description = "Tipos de instancia para los nodos EKS"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Numero deseado de nodos"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Numero minimo de nodos"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Numero maximo de nodos"
  type        = number
  default     = 5
}

variable "cluster_allowed_cidrs" {
  description = "CIDRs permitidos para el API publico del cluster"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
