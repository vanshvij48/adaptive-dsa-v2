FROM python:3.12-slim

RUN useradd -m runner
WORKDIR /sandbox

COPY runner.py /sandbox/runner.py
RUN chown -R runner:runner /sandbox

USER runner

CMD ["python", "/sandbox/runner.py"]