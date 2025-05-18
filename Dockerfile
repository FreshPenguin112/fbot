# Use an official Ubuntu base image
FROM ubuntu:22.04

# Prevent prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        nodejs \
        npm \
        python3 \
        python3-pip \
        procps \
        inotify-tools \
        lsof \
        rsync \
        curl \
        wget \
        iproute2

# Create a non-root user
RUN useradd -ms /bin/bash runner
USER runner
WORKDIR /home/runner

# Default entrypoint
ENTRYPOINT ["/bin/bash"]
