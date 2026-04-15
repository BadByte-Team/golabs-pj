pipeline {
    agent any

    tools {
        jdk 'jdk17'
        nodejs 'node18'
    }

    environment {
        DOCKER_HUB_CREDS = credentials('dockerhub-id')
        API_IMAGE        = "gjisus/golabs-api"
        UI_IMAGE         = "gjisus/golabs-ui"
        SCANNER_HOME     = tool('sonar-scanner')
        GITHUB_USER      = "GutsNet"
        REPO_ORG         = "BadByte-Team"
        INFRA_REPO       = "golabs-infra"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                    echo "BUILD_TAG: ${env.BUILD_TAG}"
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube-server') {
                    sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=golabs \
                        -Dsonar.projectName=golabs \
                        -Dsonar.sources=. \
                        -Dsonar.exclusions=**/vendor/**,**/node_modules/**,**/dist/**
                    """
                }
            }
        }

        // stage('Quality Gate') {
        //     steps {
        //         timeout(time: 5, unit: 'MINUTES') {
        //             waitForQualityGate abortPipeline: true
        //         }
        //     }
        // }

        stage('Docker Build') {
            parallel {
                stage('Build API') {
                    steps {
                        dir('golabs-api') {
                            sh "docker build -t ${API_IMAGE}:${BUILD_TAG} ."
                            sh "docker tag ${API_IMAGE}:${BUILD_TAG} ${API_IMAGE}:latest"
                            echo "API imagen: ${API_IMAGE}:${BUILD_TAG}"
                        }
                    }
                }
                stage('Build UI') {
                    steps {
                        dir('golabs-ui') {
                            sh "docker build -t ${UI_IMAGE}:${BUILD_TAG} ."
                            sh "docker tag ${UI_IMAGE}:${BUILD_TAG} ${UI_IMAGE}:latest"
                            echo "UI imagen: ${UI_IMAGE}:${BUILD_TAG}"
                        }
                    }
                }
            }
        }

        stage('Docker Push') {
            steps {
                sh "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"
                sh "docker push ${API_IMAGE}:${BUILD_TAG}"
                sh "docker push ${API_IMAGE}:latest"
                sh "docker push ${UI_IMAGE}:${BUILD_TAG}"
                sh "docker push ${UI_IMAGE}:latest"
                echo "Imágenes subidas a Docker Hub"
            }
        }

        stage('Deploy to GitOps Repo') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-token-id', usernameVariable: 'GH_USER', passwordVariable: 'GITHUB_TOKEN')]) {
                    sh """
                        rm -rf infra-repo

                        git clone https://${GH_USER}:${GITHUB_TOKEN}@github.com/${REPO_ORG}/${INFRA_REPO}.git infra-repo

                        cd infra-repo
                        git config user.email "jenkins@local.com"
                        git config user.name "Jenkins CI"

                        # Actualizar el tag de la imagen del API
                        sed -i "s|image: ${API_IMAGE}:.*|image: ${API_IMAGE}:${BUILD_TAG}|" \\
                            k8s/base/api/deployment.yaml

                        # Actualizar el tag de la imagen de la UI
                        sed -i "s|image: ${UI_IMAGE}:.*|image: ${UI_IMAGE}:${BUILD_TAG}|" \\
                            k8s/base/ui/deployment.yaml

                        git add k8s/base/api/deployment.yaml k8s/base/ui/deployment.yaml
                        git commit -m "ci: deploy version ${BUILD_TAG} from Jenkins"
                        git push origin main
                    """
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh "docker rmi ${API_IMAGE}:${BUILD_TAG} || true"
                sh "docker rmi ${API_IMAGE}:latest || true"
                sh "docker rmi ${UI_IMAGE}:${BUILD_TAG} || true"
                sh "docker rmi ${UI_IMAGE}:latest || true"
                sh "docker image prune -f || true"
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completado — API: ${API_IMAGE}:${BUILD_TAG} | UI: ${UI_IMAGE}:${BUILD_TAG}"
        }
        failure {
            echo "❌ Pipeline fallido en stage: ${env.STAGE_NAME}"
        }
        always {
            cleanWs()
        }
    }
}
