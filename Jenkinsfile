pipeline {
    agent any

    environment {
        AWS_REGION        = 'ap-south-1'
        ECR_REPO_NAME     = 'azeetech-pos-repo'
        ECS_CLUSTER       = 'azeetech-pos-cluster'
        ECS_SERVICE       = 'azeetech-pos-service'
        AWS_ACCOUNT_ID    = 'YOUR_AWS_ACCOUNT_ID'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo "Building on branch: ${env.BRANCH_NAME}"
                checkout scm
            }
        }

        stage('2. SonarQube SAST Analysis') {
            steps {
                withSonarQubeEnv('SonarQube-Server') {
                    sh """
                        sonar-scanner \
                          -Dsonar.projectKey=azeetech-pos \
                          -Dsonar.sources=.
                    """
                }
            }
        }

        stage('3. Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // --- CD Stages: Ye SIRF 'main' branch par execute honge ---

        stage('4. Docker Build & ECR Push') {
            when {
                branch 'main'
            }
            steps {
                echo 'Building Docker Image and Pushing to ECR...'
                withCredentials([usernamePassword(credentialsId: 'aws-credentials', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                        docker build -t ${ECR_REPO_NAME}:latest .
                        docker tag ${ECR_REPO_NAME}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:latest
                        docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:latest
                    """
                }
            }
        }

        stage('5. Deploy to AWS ECS Fargate') {
            when {
                branch 'main'
            }
            steps {
                echo 'Triggering Force New Deployment on AWS ECS Fargate...'
                withCredentials([usernamePassword(credentialsId: 'aws-credentials', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    sh """
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
            cleanWs()
        }
        failure {
            emailext (
                subject: "FAILED: Job '${env.JOB_NAME}' [${env.BUILD_NUMBER}] on Branch: ${env.BRANCH_NAME}",
                body: """Project: ${env.JOB_NAME}
Build Number: ${env.BUILD_NUMBER}
Branch: ${env.BRANCH_NAME}
URL of build: ${env.BUILD_URL}
Check SonarQube or Jenkins logs for failures.""",
                recipientProviders: [[$class: 'DevelopersRecipientProvider'], [$class: 'CulpritsRecipientProvider']],
                to: 'azharu1296@gmail.com'
            )
        }
        success {
            emailext (
                subject: "SUCCESS: Job '${env.JOB_NAME}' [${env.BUILD_NUMBER}] on Branch: ${env.BRANCH_NAME}",
                body: """Build was successful for Branch: ${env.BRANCH_NAME}.
Build URL: ${env.BUILD_URL}""",
                to: 'azharu1296@gmail.com'
            )
        }
    }
}