output "vpc_id" {
  description = "ID de la VPC"
  value       = module.vpc.vpc_id
}

output "eks_cluster_name" {
  description = "Nombre del cluster EKS"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint del cluster EKS"
  value       = aws_eks_cluster.main.endpoint
}

output "rds_endpoint" {
  description = "Endpoint de la base de datos RDS"
  value       = aws_db_instance.main.address
}

output "ecr_frontend_url" {
  description = "URL del repositorio ECR para frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_url" {
  description = "URL del repositorio ECR para backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "terraform_lock_table" {
  description = "Tabla DynamoDB para locking de Terraform"
  value       = aws_dynamodb_table.terraform_locks.name
}
