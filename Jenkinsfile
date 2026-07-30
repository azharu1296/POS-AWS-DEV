pipeline {
    agent any

    environment {
        // AWS & ECR Configurations
        AWS_REGION     = 'ap-south-1'
        AWS_ACCOUNT_ID = '762989749999'
        ECR_REPO_NAME  = 'azeetech-repo'
        
        // ECS Configurations
        ECS_CLUSTER    = 'azeetech-pos-cluster'
        ECS_SERVICE    = 'azeetech-pos-service'
        
        // SonarQube Tool Name & Server ID (as configured in Jenkins)
        SONAR_SCANNER_HOME = tool 'sonar-scanner'
        SONAR_SERVER       = 'sonar-server'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Checking out code from GitHub Repository...'
                checkout scm
            }
        }

        stage('2. SonarQube Code Analysis') {
            steps {
                echo 'Starting Static Application Security Testing (SAST) with SonarQube...'
                withSonarQubeEnv("${SONAR_SERVER}") {
                    sh """
                        ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=azeetech-pos-app \
                        -Dsonar.projectName="Azeetech POS Application" \
                        -Dsonar.sources=. \
                        -Dsonar.exclusions=node_modules/**,coverage/**
                    """
                }
            }
        }

        stage('3. Quality Gate Check') {
            steps {
                echo 'Waiting for SonarQube Quality Gate result...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('4. AWS ECR Login & Build Docker Image') {
            steps {
                echo 'Logging into AWS ECR and building Docker Image...'
                withCredentials([usernamePassword(credentialsId: 'aws-credentials', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    sh """
                        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                        
                        # ECR Login Command
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                        
                        # Build & Tag Image
                        docker build -t ${ECR_REPO_NAME}:${BUILD_NUMBER} .
                        docker tag ${ECR_REPO_NAME}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${BUILD_NUMBER}
                        docker tag ${ECR_REPO_NAME}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:latest
                    """
                }
            }
        }

        stage('5. Push Image to AWS ECR') {
            steps {
                echo 'Pushing updated Docker Image to AWS ECR...'
                withCredentials([usernamePassword(credentialsId: 'aws-credentials', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    sh """
                        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                        
                        docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${BUILD_NUMBER}
                        docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:latest
                    """
                }
            }
        }

        stage('6. Deploy to AWS ECS Fargate') {
            steps {
                echo 'Triggering Force New Deployment on AWS ECS Fargate Service...'
                withCredentials([usernamePassword(credentialsId: 'aws-credentials', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    sh """
                        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                        
                        aws ecs update-service \
                            --cluster ${ECS_CLUSTER} \
                            --service ${ECS_SERVICE} \
                            --force-new-deployment \
                            --region ${AWS_REGION}
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up local Docker artifacts...'
            sh 'docker image prune -f || true'
        }
        success {
            echo '🎉 CONGRATULATIONS! Pipeline completed successfully and application deployed to ECS Fargate!'
        }
        failure {
            echo '❌ Pipeline failed! Please check logs, Quality Gate status, or credentials.'
        }
    }
}